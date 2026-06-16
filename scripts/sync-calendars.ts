import { syncAllFeeds } from '../src/lib/ical';

syncAllFeeds()
  .then(results => {
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
