import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CallLog, CallOutcome, InterceptionMode } from '../calls/entities/call-log.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME ?? 'unspam',
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  entities: [CallLog],
  synchronize: true,
});

function parseCsv(content: string): Record<string, string>[] {
  const [headerLine, ...rows] = content.trim().split('\n');
  const headers = headerLine.split(',');
  return rows.map((row) => {
    const values = row.split(',');
    return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim() ?? '']));
  });
}

async function seed() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(CallLog);

  const csv = readFileSync(join(__dirname, 'data', 'spam-numbers.csv'), 'utf8');
  const rows = parseCsv(csv);

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const exists = await repo.findOne({ where: { callerNumber: row.number } });
    if (exists) { skipped++; continue; }

    await repo.save(repo.create({
      callerNumber: row.number,
      spamScore: 0.85,
      outcome: CallOutcome.BLOCKED,
      mode: InterceptionMode.NATIVE,
      carrierType: row.carrierType,
      isVoip: row.isVoip === 'true',
      isSpoofed: row.isSpoofed === 'true',
      flagCount: parseInt(row.flagCount, 10),
    }));
    inserted++;
  }

  console.log(`Seed complete — inserted: ${inserted}, skipped (already exist): ${skipped}`);
  await dataSource.destroy();
}

seed().catch((err) => { console.error(err); process.exit(1); });
