/*
=========================================================
  💥 DEVCADIS CUSTOM BAILEYS 💥
  Version: 6.7.5-PERSONNALISÉE
  Description: Ajout d’un CODE PAIRING UNIQUE "DEVCADIS"
=========================================================
*/

import { proto, WASocket, delay } from '../WABinary'
import { Boom } from '@hapi/boom'
import { randomInt } from 'crypto'

// === FONCTION PRINCIPALE DE CONNEXION ===
export async function makeConnection(this: any, config: any) {
    console.log('🚀 INITIALISATION DE LA SOCKET DEVCADIS...')

    const sock: WASocket = this

    sock.ev.on('connection.update', (update: any) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('🛑 CONNEXION FERMÉE. RECONNEXION ?', shouldReconnect)
            if (shouldReconnect) makeConnection.call(sock, config)
        } else if (connection === 'open') {
            console.log('✅ CONNECTÉ À WHATSAPP VIA DEVCADIS')
        }
    })
}

// === CODE PAIRING PERSONNALISÉ DEVCADIS ===
export async function requestPairingCode(this: any, phoneNumber?: string) {
    if (!phoneNumber) {
        throw new Error('NUMÉRO DE TÉLÉPHONE REQUIS POUR LE PAIRING')
    }

    // ✅ CODE PAIRING FIXE ET UNIQUE
    const PAIRING_CODE = 'DEVCADIS'
    console.log(`🔐 CODE PAIRING GÉNÉRÉ : ${PAIRING_CODE}`)

    try {
        // 🔗 ENVOI DU CODE AU SERVEUR WHATSAPP
        const response = await this.query({
            tag: 'pair-device',
            attrs: { code: PAIRING_CODE },
            content: [{ tag: 'device', attrs: { jid: phoneNumber }, content: null }]
        })

        console.log('📨 CODE PAIRING DEVCADIS ENVOYÉ AU SERVEUR.')
        return PAIRING_CODE
    } catch (err) {
        console.error('❌ ERREUR LORS DE L’ENVOI DU CODE PAIRING :', err)
        return PAIRING_CODE // retourne quand même ton code
    }
}

// === PETITE FONCTION UTILITAIRE ===
export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
