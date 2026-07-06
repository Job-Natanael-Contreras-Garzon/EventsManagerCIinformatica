import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyStartReminder } from "@/modules/notifications/services/push.service";

/**
 * API Route Handler: /api/cron/reminders
 * 
 * Diseñado para ser llamado periódicamente (ej: cada 10 o 15 minutos) por un planificador de tareas.
 * Busca eventos que inicien en la próxima hora y envía notificaciones push a sus coordinadores.
 */
export async function GET(request: Request) {
  // 1. Validar autorización por Token
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "El token de seguridad del cron (CRON_SECRET) no está configurado en el servidor." },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "No autorizado. Token de cron inválido o ausente." },
      { status: 401 }
    );
  }

  try {
    const now = Date.now();
    // Ventana de búsqueda: eventos que inicien entre 60 minutos y 75 minutos en el futuro
    // Esto asegura que si el cron corre cada 15 minutos, capturemos todos los eventos exactamente una vez
    const oneHourFromNow = new Date(now + 60 * 60 * 1000);
    const seventyFiveMinsFromNow = new Date(now + 75 * 60 * 1000);

    // Buscar eventos en esa franja horaria que no hayan enviado recordatorio
    const eventsToNotify = await db.event.findMany({
      where: {
        date: {
          gte: oneHourFromNow,
          lte: seventyFiveMinsFromNow,
        },
        startReminderSent: false,
        isActive: true,
        status: {
          not: "FINISHED",
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
      },
    });

    if (eventsToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay eventos próximos que requieran recordatorio en esta ventana de tiempo.",
        processedEvents: [],
      });
    }

    const processed = [];

    // Notificar a los coordinadores de cada evento
    for (const event of eventsToNotify) {
      console.log(`[Cron Reminders] Procesando recordatorio para el evento: ${event.name} (${event.id})`);
      
      await notifyStartReminder(event.id);
      
      // Marcar como recordatorio enviado
      await db.event.update({
        where: { id: event.id },
        data: { startReminderSent: true },
      });

      processed.push({
        id: event.id,
        name: event.name,
        date: event.date,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Se enviaron recordatorios de inicio para ${eventsToNotify.length} evento(s).`,
      processedEvents: processed,
    });
  } catch (error) {
    console.error("[Cron Reminders] Error en el procesador de recordatorios:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al procesar los recordatorios." },
      { status: 500 }
    );
  }
}
