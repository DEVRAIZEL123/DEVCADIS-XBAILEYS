'use strict';

const pino = require('pino');
let logger = pino({ level: 'silent' });
let DisconnectReason = {};
try {
  const baileys = require('@whiskeysockets/baileys');
  DisconnectReason = baileys.DisconnectReason || {};
} catch (e) {}

/**
 * Initialise la socket avec événements standard
 */
async function makeConnection(config) {
  const sock = this;
  if (config && config.logger) logger = config.logger;

  logger.info && logger.info('🚀 INITIALISATION DE LA SOCKET DEVCADIS-XBAILEYS...');
  sock._devcadis = sock._devcadis || { connected: false };

  // connection.update
  sock.ev.on && sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    logger.info && logger.info('[DEVCADIS] connection.update', connection);

    if (connection === 'open') {
      sock._devcadis.connected = true;
      logger.info && logger.info('✅ CONNECTÉ À WHATSAPP VIA DEVCADIS-XBAILEYS', sock.user && sock.user.id);
    }

    if (connection === 'close') {
      sock._devcadis.connected = false;
      logger.warn && logger.warn('🛑 CONNEXION FERMÉE', lastDisconnect ? lastDisconnect.error : 'unknown');

      // reconnexion automatique si pas logout
      try {
        const isLoggedOut = (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode === DisconnectReason?.loggedOut);
        if (!isLoggedOut) {
          logger.info && logger.info('[DEVCADIS] Tentative de reconnexion automatique...');
          setTimeout(() => {
            try {
              makeConnection.call(sock, config);
            } catch (err) {
              logger.error && logger.error('[DEVCADIS] Erreur lors de la reconnexion :', err && err.message ? err.message : err);
            }
          }, 2000);
        } else {
          logger.warn && logger.warn('[DEVCADIS] Session déconnectée (logout). Ne pas reconnecter automatiquement.');
        }
      } catch (err) {
        logger.error && logger.error('[DEVCADIS] Erreur lors du traitement de la fermeture :', err);
      }
    }
  });

  // messages.upsert
  if (sock.ev && sock.ev.on) {
    sock.ev.on('messages.upsert', (m) => {
      logger.debug && logger.debug('[DEVCADIS] messages.upsert', JSON.stringify(m, null, 2));
    });
  }

  return sock;
}

/**
 * Retourne le code pairing fixe DEVCADIS
 */
async function requestPairingCode(phoneNumber) {
  const sock = this;
  const PAIRING_CODE = 'DEVCADIS';

  logger.info && logger.info(`🔐 CODE PAIRING GÉNÉRÉ : ${PAIRING_CODE}`);

  // tentative d'envoi vers WhatsApp si query existe (optionnel)
  try {
    if (typeof sock.query === 'function') {
      try {
        await sock.query({
          tag: 'pair-device',
          attrs: { code: PAIRING_CODE },
          content: phoneNumber ? [{ tag: 'device', attrs: { jid: phoneNumber }, content: null }] : []
        });
        logger.info && logger.info('[DEVCADIS] Tentative d\'envoi du code pairing vers le serveur (optionnel).');
      } catch (qerr) {
        logger.debug && logger.debug('[DEVCADIS] Envoi pair-device ignoré (non supporté par le fork):', qerr && qerr.message ? qerr.message : qerr);
      }
    } else {
      logger.debug && logger.debug('[DEVCADIS] Pas de méthode query() disponible sur la socket — skip envoi pair-device.');
    }
  } catch (err) {
    logger.error && logger.error('[DEVCADIS] Erreur inattendue dans requestPairingCode:', err);
  }

  return PAIRING_CODE;
}

/**
 * Utilitaire sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  makeConnection,
  requestPairingCode,
  sleep
};
