import EventEmitter from 'events';

const eventEmitter = new EventEmitter().setMaxListeners(100);


export const EventKeys = {
    showModal: 'showModal',
    hiddenModal: 'hiddenModal',
}

export default eventEmitter;
