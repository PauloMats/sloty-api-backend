import 'dotenv/config';
import {
  PrismaClient,
  AppointmentEventType,
  AppointmentStatus,
  BusinessMode,
  BusinessStatus,
  UserRole,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();

async function main() {
  await prisma.appointmentEvent.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.serviceRequestProposal.deleteMany();
  await prisma.serviceRequest.deleteMany();
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
  await prisma.userNotificationPreference.deleteMany();
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

  await prisma.userNotificationPreference.createMany({
    data: [
      {
        userId: owner.id,
        emailEnabled: true,
        pushEnabled: true,
        whatsappEnabled: false,
      },
      {
        userId: client.id,
        emailEnabled: true,
        pushEnabled: true,
        whatsappEnabled: true,
      },
    ],
  });

  const clientAddress = await prisma.userAddress.create({
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

  const homeServicesCategory = await prisma.category.create({
    data: {
      name: 'Casa e construcao',
      slug: 'home-services',
      description: 'Pedreiros, pintores, eletricistas e manutencao.',
      icon: 'hammer',
      sortOrder: 20,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Restaurantes e delivery',
      slug: 'food-delivery',
      description: 'Cardapios, pedidos e retirada ou entrega.',
      icon: 'utensils',
      sortOrder: 30,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Saude e bem-estar',
      slug: 'health-wellness',
      description: 'Clinicas, fisioterapia e cuidado pessoal.',
      icon: 'heart-pulse',
      sortOrder: 40,
    },
  });

  const business = await prisma.business.create({
    data: {
      ownerId: owner.id,
      categoryId: beautyCategory.id,
      mode: BusinessMode.HYBRID,
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

  const comboMenu = await prisma.menuItem.create({
    data: {
      businessId: business.id,
      name: 'Combo executivo SLOTY',
      description:
        'Prato principal, bebida e sobremesa simples para teste de delivery.',
      priceCents: 4200,
      currency: 'BRL',
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      businessId: business.id,
      name: 'Suco natural',
      description: 'Bebida complementar do pedido demo.',
      priceCents: 900,
      currency: 'BRL',
      sortOrder: 2,
    },
  });

  await prisma.weeklyAvailability.createMany({
    data: [
      {
        businessId: business.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '18:00',
      },
      {
        businessId: business.id,
        dayOfWeek: 2,
        startTime: '09:00',
        endTime: '18:00',
      },
      {
        businessId: business.id,
        dayOfWeek: 3,
        startTime: '09:00',
        endTime: '18:00',
      },
      {
        businessId: business.id,
        dayOfWeek: 4,
        startTime: '09:00',
        endTime: '18:00',
      },
      {
        businessId: business.id,
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '18:00',
      },
    ],
  });

  const tomorrowLocal = DateTime.now()
    .setZone(business.timezone)
    .plus({ days: 1 })
    .set({
      hour: 10,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
  const tomorrowLocalSecond = tomorrowLocal.plus({ hours: 3 });
  const closureStart = tomorrowLocal
    .plus({ days: 2 })
    .set({ hour: 12, minute: 0 });
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
      endAt: tomorrowLocal
        .plus({ minutes: haircut.durationMinutes })
        .toUTC()
        .toJSDate(),
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
      endAt: tomorrowLocalSecond
        .plus({ minutes: beard.durationMinutes })
        .toUTC()
        .toJSDate(),
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

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      clientId: client.id,
      categoryId: homeServicesCategory.id,
      addressId: clientAddress.id,
      title: 'Preciso instalar uma prateleira e revisar uma tomada',
      description:
        'Servico simples em apartamento. Tenho a prateleira, mas preciso de furadeira e avaliacao da tomada.',
      city: 'Fortaleza',
      state: 'CE',
      latitude: -3.7319,
      longitude: -38.5267,
      budgetMinCents: 8000,
      budgetMaxCents: 18000,
      currency: 'BRL',
    },
  });

  await prisma.serviceRequestProposal.create({
    data: {
      requestId: serviceRequest.id,
      businessId: business.id,
      message:
        'Posso avaliar hoje no fim da tarde e confirmar o valor antes de iniciar.',
      estimatedPriceCents: 15000,
      estimatedDurationMinutes: 120,
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      clientId: client.id,
      businessId: business.id,
      appointmentId: pendingAppointment.id,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: client.id,
        body: 'Oi! Esse horario ainda esta disponivel?',
      },
      {
        conversationId: conversation.id,
        senderId: owner.id,
        body: 'Esta sim. Posso confirmar para voce agora.',
      },
    ],
  });

  await prisma.order.create({
    data: {
      businessId: business.id,
      clientId: client.id,
      addressId: clientAddress.id,
      subtotalCents: comboMenu.priceCents,
      deliveryFeeCents: 500,
      totalCents: comboMenu.priceCents + 500,
      currency: 'BRL',
      notes: 'Pedido seedado para validar a fila de delivery.',
      items: {
        create: [
          {
            menuItemId: comboMenu.id,
            nameSnapshot: comboMenu.name,
            unitPriceCents: comboMenu.priceCents,
            quantity: 1,
          },
        ],
      },
    },
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
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
