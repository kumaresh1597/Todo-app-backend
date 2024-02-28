
const todoDataValidation = ({todoText})=>{
    return new Promise((resolve, reject)=>{
        if(!todoText) reject('text cannont be empty');

        if(typeof(todoText) !== 'string') reject('todo should be in text format');

        if(todoText.length < 3 || todoText.length > 300) reject('todo should contain 3 - 300 characters');

        resolve();
    });
}

module.exports = {todoDataValidation};