const fs = require('fs');
const readLastLine = require('read-last-line');
const rxjs = require('rxjs');
const axios = require('axios').default;

const watchedFile = './putty.log';

console.log(`Observando as métricas colocadas em ${ watchedFile }`);

const changedFile = new rxjs.Subject();

fs.watchFile(watchedFile, { interval: 200 }, () => {
  changedFile.next();
});

const onFileChangeSubscription = changedFile.pipe(
  rxjs.throttleTime(300),
  rxjs.mergeMap(() => rxjs.from(readLastLine.read(watchedFile, 2)))
).subscribe(lastLineAdded => {
  console.log(`Dado obtido: ${ lastLineAdded.trim() }`)

  const [humidity, temperature] = lastLineAdded.trim().split(':').map(Number);

  if (!humidity || !temperature)
    return;

  axios.post('https://api-scoket-pa8.herokuapp.com/metric', {
    humidity: Number(humidity),
    temperature: Number(temperature),
  }).then(() => {
    console.log(`Métrica ${ humidity }:${ temperature } enviada com sucesso.`);
  }).catch(error => {
    console.log('Ocorreu um erro: ', error);
  });
});
