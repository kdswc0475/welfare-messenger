/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDngVFJGa1Ce7qDvsffp7X1ctV5eFDVdKo',
  authDomain: 'welfare-messenger.firebaseapp.com',
  projectId: 'welfare-messenger',
  storageBucket: 'welfare-messenger.firebasestorage.app',
  messagingSenderId: '30891500738',
  appId: '1:30891500738:web:252625b3dfd16b8810075b',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || '복지 메신저'
  const body = payload?.notification?.body || '새 메시지가 도착했습니다.'
  const data = payload?.data || {}

  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data,
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
