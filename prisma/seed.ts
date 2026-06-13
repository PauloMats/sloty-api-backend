import 'dotenv/config';
import { PrismaClient, AppointmentEventType, AppointmentStatus, BusinessStatus, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();

async function main() {
  await prisma.appointmentEvent.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.billingSubscription.deleteMany();
  await prisma.billingCustomer.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.businessClosure.deleteMany();
  await prisma.weeklyAvailability.deleteMany();
  await prisma.service.deleteMany();
  await prisma.businessMember.deleteMany();
  await prisma.business.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await argon2.hash('Password123!');

  const owner = await prisma.user.create({
    data: {
      name: 'Marcos Sloty',
      email: 'owner@sloty.local',
      passwordHash,
      phone: '+55 85 99999-1111',
      role: UserRole.OWNER,
    },
  });

  const client = await prisma.user.create({
    data: {
      name: 'Julia Cliente',
      email: 'client@sloty.local',
      passwordHash,
      phone: '+55 85 99999-2222',
      role: UserRole.CLIENT,
    },
  });

  await prisma.userAddress.create({
    data: {
      userId: client.id,
      label: 'Casa',
      recipientName: client.name,
      phone: client.phone,
      addressLine1: 'Rua Demo, 100',
      neighborhood: 'Centro',
      city: 'Fortaleza',
      state: 'CE',
      zipCode: '60000-000',
      country: 'BR',
      latitude: -3.7319,
      longitude: -38.5267,
      isDefault: true,
    },
  });

  const beautyCategory = await prisma.category.create({
    data: {
      name: 'Beleza e autocuidado',
      slug: 'beauty',
      description: 'Barbearias, saloes, unhas e estetica.',
      icon: 'scissors',
      sortOrder: 10,
    },
  });

  await prisma.category.createMany({
    data: [
      {
        name: 'Casa e construcao',
        slug: 'home-services',
        description: 'Pedreiros, pintores, eletricistas e manutencao.',
        icon: 'hammer',
        sortOrder: 20,
      },
      {
        name: 'Restaurantes e delivery',
        slug: 'food-delivery',
        description: 'Cardapios, pedidos e retirada ou entrega.',
        icon: 'utensils',
        sortOrder: 30,
      },
      {
        name: 'Saude e bem-estar',
        slug: 'health-wellness',
        description: 'Clinicas, fisioterapia e cuidado pessoal.',
        icon: 'heart-pulse',
        sortOrder: 40,
      },
    ],
  });

  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      categoryId: beautyCategory.id,
      name: 'Studio SLOTY',
      slug: 'studio-sloty',
      description: 'Negocio demo do backend SLOTY',
      category: 'beauty',
      phone: '+55 85 99999-3333',
      email: 'studio@sloty.local',
      city: 'Fortaleza',
      state: 'CE',
      country: 'BR',
      latitude: -3.735,
      longitude: -38.49,
      timezone: 'America/Fortaleza',
      status: BusinessStatus.ACTIVE,
    },
  });

  await prisma.businessMember.create({
    data: {
      businessId: business.id,
      userId: owner.id,
      role: UserRole.OWNER,
    },
  });

  const haircut = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Corte Masculino',
      description: 'Corte tradicional',
      durationMinutes: 45,
      priceCents: 4500,
      currency: 'BRL',
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 15,
    },
  });

  const beard = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Barba Premium',
      description: 'Modelagem completa',
      durationMinutes: 30,
      priceCents: 3000,
      currency: 'BRL',
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 10,
    },
  });

  await prisma.weeklyAvailability.createMany({
    data: [
      { businessId: business.id, dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
      { businessId: business.id, dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
      { businessId: business.id, dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
      { businessId: business.id, dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
      { businessId: business.id, dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
    ],
  });

  const tomorrowLocal = DateTime.now().setZone(business.timezone).plus({ days: 1 }).set({
    hour: 10,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const tomorrowLocalSecond = tomorrowLocal.plus({ hours: 3 });
  const closureStart = tomorrowLocal.plus({ days: 2 }).set({ hour: 12, minute: 0 });
  const closureEnd = closureStart.plus({ hours: 2 });

  await prisma.businessClosure.create({
    data: {
      businessId: business.id,
      startsAt: closureStart.toUTC().toJSDate(),
      endsAt: closureEnd.toUTC().toJSDate(),
      reason: 'Pausa interna',
    },
  });

  const confirmedAppointment = await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: haircut.id,
      clientId: client.id,
      startAt: tomorrowLocal.toUTC().toJSDate(),
      endAt: tomorrowLocal.plus({ minutes: haircut.durationMinutes }).toUTC().toJSDate(),
      status: AppointmentStatus.CONFIRMED,
      source: 'seed',
      confirmedAt: new Date(),
    },
  });

  const pendingAppointment = await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: beard.id,
      clientId: client.id,
      startAt: tomorrowLocalSecond.toUTC().toJSDate(),
      endAt: tomorrowLocalSecond.plus({ minutes: beard.durationMinutes }).toUTC().toJSDate(),
      status: AppointmentStatus.PENDING,
      source: 'seed',
    },
  });

  const cancelledAppointment = await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: haircut.id,
      clientId: client.id,
      startAt: tomorrowLocal.plus({ days: 1 }).toUTC().toJSDate(),
      endAt: tomorrowLocal
        .plus({ days: 1, minutes: haircut.durationMinutes })
        .toUTC()
        .toJSDate(),
      status: AppointmentStatus.CANCELLED,
      source: 'seed',
      cancelledAt: new Date(),
      cancellationReason: 'Conflito de agenda',
    },
  });

  await prisma.appointmentEvent.createMany({
    data: [
      {
        appointmentId: confirmedAppointment.id,
        type: AppointmentEventType.CREATED,
        actorUserId: client.id,
        payload: { source: 'seed' },
      },
      {
        appointmentId: confirmedAppointment.id,
        type: AppointmentEventType.CONFIRMED,
        actorUserId: owner.id,
        payload: { source: 'seed' },
      },
      {
        appointmentId: pendingAppointment.id,
        type: AppointmentEventType.CREATED,
        actorUserId: client.id,
        payload: { source: 'seed' },
      },
      {
        appointmentId: cancelledAppointment.id,
        type: AppointmentEventType.CANCELLED,
        actorUserId: owner.id,
        payload: { source: 'seed' },
      },
    ],
  });

  await prisma.billingCustomer.create({
    data: {
      businessId: business.id,
      stripeCustomerId: `cus_seed_${business.id}`,
    },
  });

  await prisma.billingSubscription.create({
    data: {
      businessId: business.id,
      stripeSubscriptionId: `sub_seed_${business.id}`,
      stripePriceId: 'price_seed_pro',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: DateTime.now().plus({ days: 30 }).toJSDate(),
      cancelAtPeriodEnd: false,
    },
  });

  console.log('Seed completed.');
  console.log({
    ownerEmail: owner.email,
    clientEmail: client.email,
    defaultPassword: 'Password123!',
    businessId: business.id,
    serviceIds: [haircut.id, beard.id],
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
