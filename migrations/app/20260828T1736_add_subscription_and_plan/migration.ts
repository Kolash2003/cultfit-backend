#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/644f1de58ee9025d8dc07ce21ad3ca86f0c7cb8e339f657d7325c3509bf902c5/contract';
import startContract from '../../snapshots/644f1de58ee9025d8dc07ce21ad3ca86f0c7cb8e339f657d7325c3509bf902c5/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b7d762c61db03bacde71fca2a865de57133bef0bfaa3f3f72ddcfe61de57e158/contract';
import endContractJson from '../../snapshots/b7d762c61db03bacde71fca2a865de57133bef0bfaa3f3f72ddcfe61de57e158/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  placeholder,
  primaryKey,
} from '@prisma/orm-postgres/migration';
import postgresAdapter from '@prisma/orm-postgres/adapter/runtime';
import { sql } from '@prisma/orm-postgres/builder/runtime';
import { createExecutionContext, createSqlExecutionStack } from '@prisma/orm-postgres/family-runtime';
import postgresTarget, { PostgresContractSerializer } from '@prisma/orm-postgres/target/runtime';

const endContract = new PostgresContractSerializer().deserializeContract(endContractJson);

const BACKFILL_TS = '1970-01-01T00:00:00.000Z';

const db = sql<End>({
  context: createExecutionContext({
    contract: endContract,
    stack: createSqlExecutionStack({ target: postgresTarget, adapter: postgresAdapter }),
  }),
});

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContractJson;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'membershipPlan',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('durationDays', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('features', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isActive', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('price', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('tier', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'subscription',
        columns: [
          col('autoRenew', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('endDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('planId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('startDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'review',
        column: col('createdAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'streak',
        column: col('createdAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'review',
        column: col('updatedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.dataTransform(endContract, 'backfill-review-updatedAt', {
        check: () =>
          db.public.review
            .select('id')
            .where((f, fns) => fns.eq(f.updatedAt, null))
            .limit(1),
        run: () =>
          db.public.review
            .update({ updatedAt: BACKFILL_TS })
            .where((f, fns) => fns.eq(f.updatedAt, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'review', column: 'updatedAt' }),
      this.addColumn({
        schema: 'public',
        table: 'streak',
        column: col('updatedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.dataTransform(endContract, 'backfill-streak-updatedAt', {
        check: () =>
          db.public.streak
            .select('id')
            .where((f, fns) => fns.eq(f.updatedAt, null))
            .limit(1),
        run: () =>
          db.public.streak
            .update({ updatedAt: BACKFILL_TS })
            .where((f, fns) => fns.eq(f.updatedAt, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'streak', column: 'updatedAt' }),
      this.alterColumnType({
        schema: 'public',
        table: 'user',
        column: 'phone',
        options: {
          qualifiedTargetType: 'text',
          formatTypeExpected: 'text',
          rawTargetTypeForLabel: 'text',
        },
      }),
      this.createIndex({
        schema: 'public',
        table: 'subscription',
        index: 'subscription_planId_idx_5b32079a',
        columns: ['planId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'subscription',
        index: 'subscription_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'subscription',
        foreignKey: {
          name: 'subscription_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'subscription',
        foreignKey: {
          name: 'subscription_planId_fkey',
          columns: ['planId'],
          references: { schema: 'public', table: 'membershipPlan', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
