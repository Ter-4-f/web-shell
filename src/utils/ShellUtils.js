export default function determineShellname (createdAt) {
    const today = new Date();
    const date = new Date(createdAt);
    if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth())
        return `${date.getHours() < 10 ? '0' : ''}${date.getHours()}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()}`;
    else 
        return `${date.getHours() < 10 ? '0' : ''}${date.getHours()}:${date.getMinutes() < 10 ? '0' : ''}${date.getMinutes()} - ${date.getDate()}`;
};