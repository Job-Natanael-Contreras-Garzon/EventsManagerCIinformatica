import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";

// Inicializar Web Push con las claves VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn("[Push Service] NEXT_PUBLIC_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY no configuradas en el entorno. Las notificaciones push no se enviarán.");
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Envía una notificación push a un usuario en todos sus dispositivos suscritos.
 * Limpia automáticamente las suscripciones expiradas o inválidas.
 */
export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const payloadString = JSON.stringify(payload);

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payloadString
      );
    } catch (error: any) {
      // Si el servicio de notificaciones indica que la suscripción ya no existe
      // (ej. 410 Gone, 404 Not Found), se elimina de la base de datos.
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`[Push Service] Suscripción inválida detectada (${error.statusCode}). Eliminando endpoint: ${sub.endpoint}`);
        await db.pushSubscription.delete({
          where: { id: sub.id },
        }).catch((err) => console.error("[Push Service] Error al eliminar suscripción huérfana:", err));
      } else {
        console.error(`[Push Service] Error al enviar notificación al endpoint ${sub.endpoint}:`, error);
      }
    }
  });

  await Promise.all(sendPromises);
}

/**
 * Notifica a los encargados del evento y a todos los administradores sobre un nuevo registro.
 */
export async function notifyNewRegistration(confirmationCode: string): Promise<void> {
  try {
    const registration = await db.registration.findUnique({
      where: { confirmationCode },
      include: {
        event: {
          include: {
            encargados: true,
          },
        },
        participant: true,
      },
    });

    if (!registration) return;

    const event = registration.event;
    const participant = registration.participant;

    // 1. Obtener los IDs de los encargados de este evento
    const coordinatorIds = event.encargados
      .map((e) => e.userId)
      .filter((id): id is string => id !== null);

    // 2. Obtener los IDs de los administradores globales
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    const adminIds = admins.map((a) => a.id);

    // 3. Consolidar destinatarios únicos
    const recipientIds = Array.from(new Set([...coordinatorIds, ...adminIds]));

    if (recipientIds.length === 0) return;

    const payload: PushPayload = {
      title: "Nuevo registro de participante",
      body: `${participant.fullName} se ha registrado en "${event.name}".`,
      url: `/admin/registrados`,
    };

    console.log(`[Push Service] Notificando nuevo registro a ${recipientIds.length} usuarios.`);
    await Promise.all(recipientIds.map((userId) => sendPushNotification(userId, payload)));
  } catch (error) {
    console.error("[Push Service] Error en notifyNewRegistration:", error);
  }
}

/**
 * Verifica si un evento ha alcanzado su cupo máximo y envía una alerta si es así.
 */
export async function notifyEventFull(eventId: string): Promise<void> {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        encargados: true,
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event || !event.maxParticipants) return;

    // Verificar si alcanzó o superó el cupo
    if (event._count.registrations >= event.maxParticipants) {
      // Obtener los encargados de este evento
      const coordinatorIds = event.encargados
        .map((e) => e.userId)
        .filter((id): id is string => id !== null);

      // Obtener administradores
      const admins = await db.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      const adminIds = admins.map((a) => a.id);

      const recipientIds = Array.from(new Set([...coordinatorIds, ...adminIds]));

      if (recipientIds.length === 0) return;

      const payload: PushPayload = {
        title: "🚨 ¡Cupo lleno!",
        body: `El evento "${event.name}" ha alcanzado su capacidad máxima (${event.maxParticipants} participantes).`,
        url: `/admin/eventos`,
      };

      console.log(`[Push Service] Notificando cupo lleno a ${recipientIds.length} usuarios.`);
      await Promise.all(recipientIds.map((userId) => sendPushNotification(userId, payload)));
    }
  } catch (error) {
    console.error("[Push Service] Error en notifyEventFull:", error);
  }
}

/**
 * Envía un recordatorio a los encargados del evento 1 hora antes de que inicie.
 */
export async function notifyStartReminder(eventId: string): Promise<void> {
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        encargados: true,
      },
    });

    if (!event) return;

    // Obtener los encargados
    const coordinatorIds = event.encargados
      .map((e) => e.userId)
      .filter((id): id is string => id !== null);

    // Obtener administradores
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    const adminIds = admins.map((a) => a.id);

    const recipientIds = Array.from(new Set([...coordinatorIds, ...adminIds]));

    if (recipientIds.length === 0) return;

    const payload: PushPayload = {
      title: "⏰ Recordatorio de actividad",
      body: `La actividad "${event.name}" inicia en 1 hora. Por favor prepárate.`,
      url: `/admin/dashboard`,
    };

    console.log(`[Push Service] Enviando recordatorio de inicio a ${recipientIds.length} usuarios.`);
    await Promise.all(recipientIds.map((userId) => sendPushNotification(userId, payload)));
  } catch (error) {
    console.error("[Push Service] Error en notifyStartReminder:", error);
  }
}
