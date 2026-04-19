"use client";

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";

export interface PasskeyResult {
  ok: boolean;
  error?: string;
}

export async function isPasskeyAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!browserSupportsWebAuthn()) return false;
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

export async function registrarPasskey(
  nomeDispositivo?: string,
): Promise<PasskeyResult> {
  try {
    const optsRes = await fetch("/api/auth/passkey/register/options", {
      method: "POST",
    });
    if (!optsRes.ok) {
      const body = await optsRes.json().catch(() => ({}));
      return { ok: false, error: body.error ?? "Falha ao obter opções" };
    }
    const opts = await optsRes.json();

    const attestation = await startRegistration({ optionsJSON: opts });

    const verifyRes = await fetch("/api/auth/passkey/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response: attestation,
        nome_dispositivo: nomeDispositivo ?? "",
      }),
    });

    if (!verifyRes.ok) {
      const body = await verifyRes.json().catch(() => ({}));
      return { ok: false, error: body.error ?? "Falha ao verificar" };
    }
    return { ok: true };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    if (err.name === "NotAllowedError") {
      return { ok: false, error: "Cancelado pelo usuário ou biometria negada" };
    }
    return { ok: false, error: err.message ?? "Erro inesperado" };
  }
}

export async function autenticarPasskey(): Promise<PasskeyResult> {
  try {
    const optsRes = await fetch("/api/auth/passkey/authenticate/options", {
      method: "POST",
    });
    if (!optsRes.ok) {
      const body = await optsRes.json().catch(() => ({}));
      return { ok: false, error: body.error ?? "Falha ao obter opções" };
    }
    const opts = await optsRes.json();

    const assertion = await startAuthentication({ optionsJSON: opts });

    const verifyRes = await fetch("/api/auth/passkey/authenticate/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: assertion }),
    });

    if (!verifyRes.ok) {
      const body = await verifyRes.json().catch(() => ({}));
      return { ok: false, error: body.error ?? "Falha ao autenticar" };
    }
    return { ok: true };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    if (err.name === "NotAllowedError") {
      return { ok: false, error: "Cancelado pelo usuário" };
    }
    return { ok: false, error: err.message ?? "Erro inesperado" };
  }
}
