function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeInMemoryMembershipDependencies(authState) {
  let nextApplicationId = 1;
  let nextMemberId = 1;
  const applications = [];
  const members = [];

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
        .sort((a, b) => b.applicationId - a.applicationId);
      return mapApplication(rows[0]);
    },

    async hasBlockingApplication(userId) {
      const row = applications
        .filter(
          (application) =>
            application.userId === Number(userId) &&
            ['PENDING', 'APPROVED'].includes(application.status)
        )
        .sort((a, b) => b.applicationId - a.applicationId)[0];

      return row?.status || null;
    },

    async createApplication(userId) {
      const now = new Date('2026-06-10T00:00:00.000Z');
      const application = {
        applicationId: nextApplicationId,
        userId: Number(userId),
        status: 'PENDING',
        appliedAt: now,
        approvedAt: null,
        reviewedBy: null,
        reviewNote: null,
      };
      nextApplicationId += 1;
      applications.push(application);

      let member = members.find((item) => item.userId === Number(userId));
      if (!member) {
        member = {
          memberId: nextMemberId,
          userId: Number(userId),
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

      return mapApplication(application);
    },

    async findById(applicationId) {
      return mapApplication(applications.find((application) => application.applicationId === Number(applicationId)));
    },

    async listApplications({ status, page = 1, limit = 20 } = {}) {
      const filtered = applications.filter((application) => !status || application.status === status);
      const offset = (Number(page) - 1) * Number(limit);
      return {
        applications: filtered.slice(offset, offset + Number(limit)).map(mapApplication),
        page: Number(page),
        limit: Number(limit),
      };
    },

    async approve(applicationId, reviewerId) {
      return review(applicationId, reviewerId, 'APPROVED');
    },

    async reject(applicationId, reviewerId, reason) {
      return review(applicationId, reviewerId, 'REJECTED', reason);
    },
  };

  function review(applicationId, reviewerId, status, reason = null) {
    const application = applications.find((item) => item.applicationId === Number(applicationId));
    if (!application) return null;
    if (application.status !== 'PENDING') return { invalidStatus: application.status };

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

    return mapApplication(application);
  }

  return {
    membershipRepository,
    state: { applications, members },
  };
}

module.exports = {
  makeInMemoryMembershipDependencies,
};
