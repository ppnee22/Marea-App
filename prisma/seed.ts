import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;
  const name = process.env.SEED_USER_NAME ?? "Admin";

  if (!email || !password) {
    console.log(
      "SEED_USER_EMAIL / SEED_USER_PASSWORD non impostate: salto la creazione dell'utente.\n" +
        "Per creare un utente esegui: SEED_USER_EMAIL=tu@example.com SEED_USER_PASSWORD=... npx prisma db seed"
    );
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase().trim() },
      update: { passwordHash, name },
      create: { email: email.toLowerCase().trim(), passwordHash, name },
    });
    console.log(`Utente pronto: ${user.email}`);
  }

  await prisma.platformSetting.upsert({
    where: { platform: "BOOKING" },
    update: {},
    create: { platform: "BOOKING", commissionPercent: 15, taxPercent: 21 },
  });
  await prisma.platformSetting.upsert({
    where: { platform: "AIRBNB" },
    update: {},
    create: { platform: "AIRBNB", commissionPercent: 3, taxPercent: 21 },
  });
  console.log("Impostazioni piattaforme pronte (Booking 15% commissione, Airbnb 3% commissione, tasse 21% cedolare secca).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
