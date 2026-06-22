import avatar1Url from '../../avatar-1.png'
import avatar2Url from '../../avatar-2.png'

export const socialIcons = [
  { name: '头像 1', icon: 'avatar-1', color: 'transparent', imgUrl: avatar1Url, isAvatar: true },
  { name: '头像 2', icon: 'avatar-2', color: 'transparent', imgUrl: avatar2Url, isAvatar: true }
]

export function getSocial(icon) {
  return socialIcons.find(item => item.icon === icon) || socialIcons[1]
}
