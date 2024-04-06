export function formatTimer(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainder = seconds % 60;
    if (minutes < 10) 
        minutes = '0' + minutes;
    if (remainder === 0) 
        remainder = '00';

    return `${minutes}:${remainder}`;
}