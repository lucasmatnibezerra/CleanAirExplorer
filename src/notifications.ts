export async function requestNotificationPermission(): Promise<NotificationPermission>{
  if(!('Notification' in window)){
    alert('This browser does not support Notifications API')
    return 'denied'
  }
  if(Notification.permission === 'granted') return 'granted'
  if(Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}
