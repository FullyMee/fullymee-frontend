import flowingWaterfallImg from '../assets/avatars/flowing_waterfall.png';
import crackedMirrorImg from '../assets/avatars/cracked_mirror.jpg';
import emptySwingImg from '../assets/avatars/empty_swing.jpg';
import lockedDiaryImg from '../assets/avatars/locked_diary.jpg';
import tornPhotographImg from '../assets/avatars/torn_photograph.jpg';
import silentForestImg from '../assets/avatars/silent_forest.jpg';
import brokenConstellationImg from '../assets/avatars/broken_constellation.jpg';

export const AVATAR_OPTIONS = [
    {
        id: 'flowing_waterfall',
        name: 'Flowing Waterfall',
        quote: '"What flows, heals."',
        description: 'Represents a continuous journey of renewal. Like water, you find a way around every obstacle, constantly moving forward and washing away the past.',
        image: flowingWaterfallImg
    },
    {
        id: 'cracked_mirror',
        name: 'Cracked Mirror',
        quote: '"You are more than what broke."',
        description: 'Represents the self beyond difficult chapters. What has cracked may change the reflection, but it can never contain your whole story.',
        image: crackedMirrorImg
    },
    {
        id: 'empty_swing',
        name: 'Empty Swing',
        quote: '"Some goodbyes never stop echoing."',
        description: 'A quiet tribute to the spaces left behind by others. It is an acknowledgment of loss, but also of the gentle motion of time passing.',
        image: emptySwingImg
    },
    {
        id: 'locked_diary',
        name: 'Locked Diary',
        quote: '"Not every truth is ready for daylight."',
        description: 'A guardian of unspoken thoughts. Sometimes the most profound things we feel are the ones we choose to keep safely hidden away.',
        image: lockedDiaryImg
    },
    {
        id: 'torn_photograph',
        name: 'Torn Photograph',
        quote: '"Some memories refuse to fade."',
        description: 'A reminder that even fragmented pieces hold immense meaning. It symbolizes holding onto what matters most, regardless of imperfection.',
        image: tornPhotographImg
    },
    {
        id: 'silent_forest',
        name: 'Silent Forest',
        quote: '"Peace often speaks in silence."',
        description: 'A sanctuary of deep calm and reflection. It represents the quiet strength found in solitude and the steady rhythm of nature.',
        image: silentForestImg
    },
    {
        id: 'broken_constellation',
        name: 'Broken Constellation',
        quote: '"Even broken stars become someone\'s sky."',
        description: 'A testament to finding beauty in the fragmented. It suggests that even scattered pieces can form a breathtaking new pattern.',
        image: brokenConstellationImg
    }
];

export const getAvatarById = (id) => {
    const avatar = AVATAR_OPTIONS.find(a => a.id === id);
    return avatar ? avatar.image : flowingWaterfallImg; // Default fallback
};
