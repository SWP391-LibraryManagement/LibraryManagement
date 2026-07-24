import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const profilePagePath = new URL('../src/component/userProfile/UserProfile.jsx', import.meta.url);
const profileApiPath = new URL('../src/api/profileApi.js', import.meta.url);

test('FE03 profile PUT excludes the read-only avatarUrl field', async () => {
  const source = await readFile(profileApiPath, 'utf8');
  const payloadBody = source.match(/function buildProfileUpdatePayload\(profile\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(payloadBody, /fullName:/);
  assert.match(payloadBody, /address:/);
  assert.match(payloadBody, /dateOfBirth:/);
  assert.match(payloadBody, /phone:/);
  assert.doesNotMatch(payloadBody, /avatarUrl:/);
  assert.doesNotMatch(source, /function denormalizeAvatarUrl/);
});

test('FE02 profile requests use one-refresh recovery and clear auth state on failure', async () => {
  const source = await readFile(profileApiPath, 'utf8');

  assert.match(source, /async function authorizedRequest\(config, fallbackMessage\)/);
  assert.match(source, /error\.response\?\.status === 401 && !config\._retried/);
  assert.match(source, /_retried: true/);
  assert.match(source, /storage\.setItem\('accessToken', accessToken\)/);
  assert.match(source, /function clearStoredAuth\(\)/);
  assert.match(source, /window\.location\.assign\('\/login'\)/);
  assert.match(source, /export async function fetchMyProfile\(\)[\s\S]*?authorizedRequest/);
  assert.match(source, /export async function requestChangePasswordOtp[\s\S]*?authorizedRequest/);
  assert.match(source, /export async function confirmChangePassword[\s\S]*?authorizedRequest/);
});

test('FE03 edit dialog changes avatars only through the upload control', async () => {
  const source = await readFile(profilePagePath, 'utf8');

  assert.match(source, /type="file"/);
  assert.match(source, /uploadMyAvatar\(avatarFile\)/);
  assert.doesNotMatch(source, /<span>Avatar URL<\/span>/);
  assert.doesNotMatch(source, /name="avatarUrl"/);
  assert.doesNotMatch(source, /avatarUrl:\s*profile\?\.avatarUrl/);
  assert.doesNotMatch(source, /avatarUrl:\s*updatedProfile\.avatarUrl/);
});

test('FE03 avatar picker keeps the approved type and 2 MB feedback', async () => {
  const source = await readFile(profilePagePath, 'utf8');

  assert.match(source, /JPG, JPEG, PNG hoặc WebP/);
  assert.match(source, /không được vượt quá 2 MB/);
  assert.match(source, /const MAX_AVATAR_SIZE = 2 \* 1024 \* 1024/);
});
