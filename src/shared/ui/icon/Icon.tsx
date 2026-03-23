import Image from 'next/image';
import adaptIcon from './assets/adapt.svg';
import femaleTeacherIcon from './assets/female-teacher.png';
import gradIcon from './assets/grad.png';
import leafDropIcon from './assets/leaf-drop.svg';
import pawIcon from './assets/paw.svg';
import schoolIcon from './assets/school.png';
import defaultLogo from './assets/default-logo.svg';
import speakerTwoIcon from './assets/speaker-two.svg';
import microphoneIcon from './assets/microphone.svg';
import videoCameraIcon from './assets/video-camera.svg';
import numberOneIcon from './assets/number-one.svg';
import checkmarkIcon from './assets/checkmark.svg';
import starsIcon from './assets/stars.svg';
import eyeIcon from './assets/eye.svg';
import messageIcon from './assets/message.svg';
import raisedHandIcon from './assets/raised-hand.svg';
import openBookIcon from './assets/open-book.svg';
import clipboard from './assets/clipboard.svg';
import bookIcon from './assets/book-icon.svg';
import school from './assets/school-icon.svg';
import studentIcon from './assets/student-icon.svg';
import qrIcon from './assets/qr.svg';

import homeActive from './assets/home-active.svg';
import homeInactive from './assets/home-inactive.svg';
import lessonsActive from './assets/lessons-active.svg';
import lessonsInactive from './assets/lessons-inactive.svg';
import connectInactive from './assets/connect-inactive.svg';
import profileInactive from './assets/profile-inactive.svg';

export type IconType = 'adapt' | 'female-teacher' | 'grad' | 'leaf-drop' | 'paw' | 'school' | 'default' | 'speaker-two' | 'microphone' | 'video-camera' | 'number-one' | 'checkmark' | 'stars' | 'eye' | 'message' | 'raised-hand' | 'open-book' | 'clipboard' | 'book-icon' | 'school-icon' | 'student-icon' | 'qr' | 'home-active' | 'home-inactive' | 'lessons-active' | 'lessons-inactive' | 'connect-inactive' | 'profile-inactive';

export const iconMap = {
    'adapt': adaptIcon,
    'female-teacher': femaleTeacherIcon,
    'grad': gradIcon,
    'leaf-drop': leafDropIcon,
    'paw': pawIcon,
    'school': schoolIcon,
    'default': defaultLogo,
    'speaker-two': speakerTwoIcon,
    'microphone': microphoneIcon,
    'video-camera': videoCameraIcon,
    'number-one': numberOneIcon,
    'checkmark': checkmarkIcon,
    'stars': starsIcon,
    'eye': eyeIcon,
    'message': messageIcon,
    'raised-hand': raisedHandIcon,
    'open-book': openBookIcon,
    'clipboard': clipboard,
    'book-icon': bookIcon,
    'school-icon': school,
    'student-icon': studentIcon,
    'qr': qrIcon,
    'home-active': homeActive,
    'home-inactive': homeInactive,
    'lessons-active': lessonsActive,
    'lessons-inactive': lessonsInactive,
    'connect-inactive': connectInactive,
    'profile-inactive': profileInactive
};

export function Icon({ type, alt, width = 100, height = 100, className }: { type: IconType, alt?: string, width?: number, height?: number, className?: string }) {
    const src = iconMap[type];

    if (!src) return null;

    return (
        <Image src={src} alt={alt || type} width={width} height={height} className={className} />
    )
}