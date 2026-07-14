const test = require('node:test');
const assert = require('node:assert/strict');

const { transformSchema } = require('../../scripts/prepare-azure-schema');

test('removes CREATE DATABASE and USE batches for an existing Azure SQL database', () => {
  const source = `
SET ANSI_NULLS ON;
GO
CREATE DATABASE LibraryManagementDB;
GO
USE LibraryManagementDB;
GO
CREATE TABLE Roles (RoleId INT PRIMARY KEY);
GO
CREATE TABLE Users (UserId INT PRIMARY KEY);
GO
CREATE TABLE BorrowRequests (BorrowRequestId INT PRIMARY KEY);
GO
CREATE TABLE Fines (FineId INT PRIMARY KEY);
GO
CREATE TABLE Notifications (NotificationId INT PRIMARY KEY);
GO
CREATE TABLE AuditLogs (AuditLogId INT PRIMARY KEY);
GO
`;

  const result = transformSchema(source);

  assert.doesNotMatch(result, /CREATE\s+DATABASE/i);
  assert.doesNotMatch(result, /^\s*USE\s+/im);
  assert.match(result, /CREATE TABLE Roles/);
  assert.match(result, /CREATE TABLE AuditLogs/);
});

test('rejects a schema missing required application tables', () => {
  const source = `
CREATE TABLE Roles (RoleId INT);
GO
CREATE TABLE Users (UserId INT);
GO
CREATE TABLE BorrowRequests (BorrowRequestId INT);
GO
CREATE TABLE Fines (FineId INT);
GO
CREATE TABLE Notifications (NotificationId INT);
GO
`;

  assert.throws(
    () => transformSchema(source),
    /required table AuditLogs/i
  );
});
