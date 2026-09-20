/**
 * Grants or revokes Continuum Plus for a user until store billing is wired in.
 *   npm run plan:set -- someone@example.com 30    (add 30 days)
 *   npm run plan:set -- someone@example.com 0     (back to free)
 */
import { PrismaClient } from '@prisma/client';
import { extendPremium } from '../src/modules/plan/plan.util';

async function main() {
  const [email, daysArg] = process.argv.slice(2);
  const days = Number(daysArg);
  if (!email || !Number.isFinite(days)) {
    console.error('Usage: npm run plan:set -- <email> <days (0 = revoke)>');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, premiumUntil: true } });
    if (!user) throw new Error(`No user with email ${email}`);
    const premiumUntil = days > 0 ? extendPremium(user.premiumUntil, days) : null;
    await prisma.user.update({ where: { id: user.id }, data: { premiumUntil } });
    console.log(premiumUntil ? `${email}: Plus until ${premiumUntil.toISOString()}` : `${email}: back to Free`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
