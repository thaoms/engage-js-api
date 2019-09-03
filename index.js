import EngageApi from "@thaoms/engage-js-api";
const HttpClientAxios = EngageApi.HttpClientAxios;

const authorizationUrl = EngageApi.getAuthorizationUrl({
    clientId: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
    scope: 'accounts_read accounts_write',
});

console.log(authorizationUrl);

const tokenUrl = EngageApi.getAuthorizationTokenUrl({
    clientId: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
    clientSecret: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
    code: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
});

console.log(tokenUrl);

const engageApi = new EngageApi(
    new HttpClientAxios({
        headers: {},
    }),
    'xxxxxxxxxxxxxxxxxxxxxxxxx'
);

engageApi.getUsersForAccount('17881', 20)
        .then((result) => {
            console.log(result);
        }).catch((e) => {
            console.log(e);
        });


