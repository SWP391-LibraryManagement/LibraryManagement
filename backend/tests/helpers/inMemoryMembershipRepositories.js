function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function compareApplications(left, right) {
  const appliedAtDifference =
    new Date(right.appliedAt).getTime() - new Date(left.appliedAt).getTime();
  return appliedAtDifference || right.applicationId - left.applicationId;
}

function makeBarrier(expectedArrivals, label) {
  let arrivals = 0;
  let release;
  let reject;
  const barrier = new Promise((resolve, rejectPromise) => {
    release = resolve;
    reject = rejectPromise;
  });
  const timeout = setTimeout(() => {
    reject(new Error(`${label} expected ${expectedArrivals} concurrent arrivals.`));
  }, 2000);

  return async function waitAtBarrier() {
    arrivals += 1;
    if (arrivals === expectedArrivals) {
      clearTimeout(timeout);
      release();
    }
    await barrier;
  };
}

function makeInMemoryMembershipDependencies(authState, options = {}) {
  let nextApplicationId = 1;
  let nextMemberId = 1;
  const applications = [];
  const members = [];
  const waitForBlockingChecks = options.synchronizeBlockingChecks
    ? makeBarrier(2, 'Membership blocking check barrier')
    : null;
  const waitForReviewReads = options.synchronizeReviewReads
    ? makeBarrier(2, 'Membership review barrier')
    : null;
  const mutationLocks = new Map();

  async function withMutationLock(key, operation) {
    const previous = mutationLocks.get(key) || Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => current);
    mutationLocks.set(key, queued);

    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (mutationLocks.get(key) === queued) mutationLocks.delete(key);
    }
  }

  function snapshotState() {
    return {
      applications: applications.map((item) => ({
        ...item,
        appliedAt: new Date(item.appliedAt),
        approvedAt: item.approvedAt ? new Date(item.approvedAt) : null,
      })),
      members: members.map((item) => ({
        ...item,
        approvedAt: item.approvedAt ? new Date(item.approvedAt) : null,
        createdAt: new Date(item.createdAt),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      })),
      nextApplicationId,
      nextMemberId,
    };
  }

  function restoreState(snapshot) {
    applications.splice(0, applications.length, ...snapshot.applications);
    members.splice(0, members.length, ...snapshot.members);
    nextApplicationId = snapshot.nextApplicationId;
    nextMemberId = snapshot.nextMemberId;
  }

  function pendingConflictError() {
    const error = new Error('A pending membership application already exists.');
    error.code = 'MEMBERSHIP_PENDING_CONFLICT';
    return error;
  }

  function getUser(userId) {
    return authState.users.find((user) => user.userId === Number(userId)) || null;
  }

  function mapApplication(application) {
    if (!application) return null;
    const user = getUser(application.userId);

    return clone({
      ...application,
      applicant: {
        userId: user?.userId || application.userId,
        email: user?.email || null,
        username: user?.username || null,
        status: user?.status || null,
        fullName: user?.fullName || null,
        phone: user?.phone || null,
      },
      rejectionReason: application.status === 'REJECTED' ? application.reviewNote : null,
    });
  }

  function mapMember(member) {
    return member ? clone(member) : null;
  }

  function seedApplication({
    applicationId = nextApplicationId,
    userId,
    status = 'PENDING',
    appliedAt = new Date('2026-06-10T00:00:00.000Z'),
    approvedAt = null,
    reviewedBy = null,
    reviewNote = null,
  }) {
    const application = {
      applicationId: Number(applicationId),
      userId: Number(userId),
      status,
      appliedAt: new Date(appliedAt),
      approvedAt: approvedAt ? new Date(approvedAt) : null,
      reviewedBy: reviewedBy == null ? null : Number(reviewedBy),
      reviewNote,
    };
    applications.push(application);
    nextApplicationId = Math.max(nextApplicationId, application.applicationId + 1);
    return mapApplication(application);
  }

  function seedMember({
    memberId = nextMemberId,
    userId,
    status = 'PENDING',
    approvedAt = null,
    approvedBy = null,
    createdAt = new Date('2026-06-10T00:00:00.000Z'),
    updatedAt = null,
  }) {
    const member = {
      memberId: Number(memberId),
      userId: Number(userId),
      status,
      approvedAt: approvedAt ? new Date(approvedAt) : null,
      approvedBy: approvedBy == null ? null : Number(approvedBy),
      createdAt: new Date(createdAt),
      updatedAt: updatedAt ? new Date(updatedAt) : null,
    };
    members.push(member);
    nextMemberId = Math.max(nextMemberId, member.memberId + 1);
    return mapMember(member);
  }

  const membershipRepository = {
    async findUser(userId) {
      return clone(getUser(userId));
    },

    async findMemberByUserId(userId) {
      return mapMember(members.find((member) => member.userId === Number(userId)));
    },

    async findLatestByUserId(userId) {
      const rows = applications
        .filter((application) => application.userId === Number(userId))
        .sort(compareApplications);
      return mapApplication(rows[0]);
    },

    async hasBlockingApplication(userId) {
      const row = applications
        .filter(
          (application) =>
            application.userId === Number(userId) &&
            ['PENDING', 'APPROVED'].includes(application.status)
        )
        .sort(compareApplications)[0];

      if (waitForBlockingChecks) {
        await waitForBlockingChecks();
      }

      return row?.status || null;
    },

    async createApplication(userId, { onBeforeCommit } = {}) {
      const numericUserId = Number(userId);
      return withMutationLock(`user:${numericUserId}`, async () => {
        if (
          applications.some(
            (application) =>
              application.userId === numericUserId && application.status === 'PENDING'
          )
        ) {
          throw pendingConflictError();
        }

        const snapshot = snapshotState();
        try {
          const now = new Date('2026-06-10T00:00:00.000Z');
          const application = {
            applicationId: nextApplicationId,
            userId: numericUserId,
            status: 'PENDING',
            appliedAt: now,
            approvedAt: null,
            reviewedBy: null,
            reviewNote: null,
          };
          nextApplicationId += 1;
          applications.push(application);

          let member = members.find((item) => item.userId === numericUserId);
          if (!member) {
            member = {
              memberId: nextMemberId,
              userId: numericUserId,
              status: 'PENDING',
              approvedAt: null,
              approvedBy: null,
              createdAt: now,
              updatedAt: null,
            };
            nextMemberId += 1;
            members.push(member);
          } else {
            member.status = 'PENDING';
            member.approvedAt = null;
            member.approvedBy = null;
            member.updatedAt = now;
          }

          const result = { ...mapApplication(application), member: mapMember(member) };
          if (typeof onBeforeCommit === 'function') {
            await onBeforeCommit({ application: result, member: result.member });
          }
          return result;
        } catch (error) {
          restoreState(snapshot);
          throw error;
        }
      });
    },

    async findById(applicationId) {
      return mapApplication(applications.find((application) => application.applicationId === Number(applicationId)));
    },

    async listApplications({ status, page = 1, limit = 20 } = {}) {
      const safePage = Math.max(Number(page) || 1, 1);
      const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
      const filtered = applications
        .filter((application) => !status || application.status === status)
        .sort(compareApplications);
      const offset = (safePage - 1) * safeLimit;
      return {
        applications: filtered.slice(offset, offset + safeLimit).map(mapApplication),
        page: safePage,
        limit: safeLimit,
        total: filtered.length,
        totalPages: Math.max(Math.ceil(filtered.length / safeLimit), 1),
      };
    },

    async approve(applicationId, reviewerId, options) {
      return review(applicationId, reviewerId, 'APPROVED', null, options);
    },

    async reject(applicationId, reviewerId, reason, options) {
      return review(applicationId, reviewerId, 'REJECTED', reason, options);
    },
  };

  async function review(applicationId, reviewerId, status, reason = null, { onBeforeCommit } = {}) {
    if (waitForReviewReads) {
      await waitForReviewReads();
    }

    const numericApplicationId = Number(applicationId);
    return withMutationLock(`application:${numericApplicationId}`, async () => {
      const application = applications.find(
        (item) => item.applicationId === numericApplicationId
      );
      if (!application) return null;
      if (application.status !== 'PENDING') return { invalidStatus: application.status };

      const snapshot = snapshotState();
      try {
        const now = new Date('2026-06-10T01:00:00.000Z');
        application.status = status;
        application.approvedAt = status === 'APPROVED' ? now : null;
        application.reviewedBy = Number(reviewerId);
        application.reviewNote = reason;

        let member = members.find((item) => item.userId === application.userId);
        if (!member) {
          member = { memberId: nextMemberId, userId: application.userId, createdAt: now };
          nextMemberId += 1;
          members.push(member);
        }
        member.status = status;
        member.approvedAt = status === 'APPROVED' ? now : null;
        member.approvedBy = status === 'APPROVED' ? Number(reviewerId) : null;
        member.updatedAt = now;

        const result = {
          ...mapApplication(application),
          member: mapMember(member),
          decisionAt: now,
        };
        if (typeof onBeforeCommit === 'function') {
          await onBeforeCommit({
            application: result,
            member: result.member,
            decisionAt: now,
          });
        }
        return result;
      } catch (error) {
        restoreState(snapshot);
        throw error;
      }
    });
  }

  return {
    membershipRepository,
    seedApplication,
    seedMember,
    state: { applications, members },
  };
}

module.exports = {
  makeInMemoryMembershipDependencies,
};
