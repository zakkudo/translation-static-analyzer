
import Translator from '@zakkudo/translator';

const translator = new Translator();
const { __, __n } = translator;

console.log(__('Lets see how this works!'));
console.log(__n("I'm going to eat %d apple!", "I'm going to eat %d apples!", 3));

