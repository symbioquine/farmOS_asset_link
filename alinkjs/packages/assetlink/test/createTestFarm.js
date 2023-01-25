import fetch from 'cross-fetch';

const delay = time => new Promise(res => setTimeout(res, time));

// Uses https://github.com/symbioquine/farm-faux-cloud to create fresh test farmOS instances
export const createTestFarm = async function () {
    const init_data = await fetch('http://localhost/meta/farm', { method: 'POST' })
        .then((response) => response.json());

    const url = new URL(`http://localhost${init_data.path}`);

    await delay(100);

    const tokenUrl = `${url}/oauth/token`;

    const auth = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/vnd.api+json',
        },
        body: `grant_type=password&username=${init_data.username}&password=${init_data.password}&client_id=farm&scope=farm_manager`,
    }).then((response) => response.json());

    return {
        init_data,
        url,
        fetch: async (reqUrl, opts) => {
            const options = opts || {};

            const requestUrl = new URL(reqUrl, url);

            const isFarmOSRequest = requestUrl.host === url.host && requestUrl.pathname.startsWith(url.pathname);

            if (isFarmOSRequest) {
                if (!options.headers) {
                    options.headers = {};
                }
                options.headers.Authorization = `Bearer ${auth.access_token}`;
            }

            return await fetch(reqUrl, options);
        },
        cleanup: async () => {
            await fetch(`http://localhost/meta/farm/${init_data.id}`, { method: 'DELETE' });
        },
    };
};
