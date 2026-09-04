#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/644f1de58ee9025d8dc07ce21ad3ca86f0c7cb8e339f657d7325c3509bf902c5/contract';
import endContract from '../../snapshots/644f1de58ee9025d8dc07ce21ad3ca86f0c7cb8e339f657d7325c3509bf902c5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e46f29be11cbb1604f830962cfd9cd5a2d1f54046c4cde56e4f405f5b841b30f/contract';
import startContract from '../../snapshots/e46f29be11cbb1604f830962cfd9cd5a2d1f54046c4cde56e4f405f5b841b30f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'streak',
        columns: [
          col('currentStreak', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lastActivityDate', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('longestStreak', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'streak',
        index: 'streak_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'streak',
        foreignKey: {
          name: 'streak_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
