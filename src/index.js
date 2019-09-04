/**
 * The Engage API
 * @author Thomas Van Kerckvoorde <thomas.vankerckvoorde@clarabridge.com>
 * @namespace
 */
class EngageApi {
    /** @constant
     * @private
     * @type {string}
     * @default
     */
    static authorizationUrl = 'https://app.engagor.com/oauth/authorize/';
    /** @constant
     * @private
     * @type {string}
     * @default
     */
    static tokenUrl = 'https://app.engagor.com/oauth/access_token/';
    /** @constant
     * @private
     * @type {string}
     * @default
     */
    static baseUrl = 'https://api.engagor.com';

    /**
     * Engage API
     * @constructor
     * @param {httpclient} httpClient - a http client (HttpClientAxios is included)
     * @param {string} accessToken
     */
    constructor(httpClient, accessToken) {
        if (!accessToken) {
            throw 'Access Token is required';
        }

        if (!httpClient) {
            throw 'A valid Http Client is required, use ours, or make one based on ours';
        }

        this.httpClient = httpClient;
        this.accessToken = accessToken;
    }

    /**
     * Returns the authorization url.
     * @function getAuthorizationUrl
     * @memberOf EngageApi
     * @static
     * @param {object} config - Configuration object
     * @param {string} config.clientId
     * @param {array} config.scope - ex. ['accounts_read', 'accounts_write']
     * @param {string} config.state
     * @returns {string}
     */
    static getAuthorizationUrl = ({ clientId, scope, state }) => {
        let requestUrl = `${EngageApi.authorizationUrl}?client_id=${clientId}&response_type=code`;

        if (state) {
            requestUrl += `&state=${encodeURIComponent(state)}`;
        }

        if (scope && Array.isArray(scope)) {
            const scopeString = scope.join(' ');
            requestUrl += `&scope=${encodeURIComponent(scopeString)}`;
        }

        return requestUrl;
    };

    /**
     * Returns the authorization token url
     * @function getAuthorizationTokenUrl
     * @memberOf EngageApi
     * @static
     * @param {object} config - Configuration object
     * @param {string} config.clientId
     * @param {string} config.clientSecret
     * @param {string} config.code
     * @returns {string}
     */
    static getAuthorizationTokenUrl = ({ clientId, clientSecret, code }) => {
        return `${EngageApi.tokenUrl}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${code}`;
    };

    /** Generic request method - used to modify the url before sending it to the http client.
     * @private
     * @memberOf EngageApi
     * @function request
     * @param url
     * @param method
     * @param headers
     * @param body
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*|Promise<*>>}
     */
    request = async (url, method, headers = null, body = null) => {
        url.searchParams.set('access_token', this.accessToken);

        return await this.httpClient.request(url.toString(), method, headers, body);
    };

    /**
     * Adds extra query parameters the url if given.
     * @private
     * @memberOf EngageApi
     * @function addQueryParams
     * @param {URL} url
     * @param {object} queryParams
     * @returns {URL}
     */
    addQueryParams = (url, queryParams) => {
        for (let [index, value] of Object.entries(queryParams)) {
            if (index && value) {
                url.searchParams.set(index, value);
            }
        }
        return url;
    };

    /**
     * Returns the list of users for a certain account.
     * @function getUsersForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {number} [limit=null]
     * @param {string} [pageToken=null] - used for paging
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A promise with an object of users.
     */
    getUsersForAccount = async (accountId, limit = null, pageToken = null) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/users`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'limit': limit,
            'page_token': pageToken,
        });

        return await this.request(url);
    };

    /**
     * Returns the list of User Roles for a certain account.
     * @function getUserRolesForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [limit=null]
     * @param {string} [pageToken=null] - used for paging
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A promise with an object of lists of user roles.
     */
    getUserRolesForAccount = async (accountId, limit = null, pageToken = null) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/userroles`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'limit': limit,
            'page_token': pageToken,
        });

        return await this.request(url.toString());
    };

    /**
     * Returns a user for/from a certain account.
     * @function getUserForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} userId
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A promise with an object of a user.
     */
    getUserForAccount = async (accountId, userId) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!userId) {
            throw 'Please give a user ID';
        }

        let url = new URL(`/${accountId}/settings/user/${userId}`, EngageApi.baseUrl);

        return await this.request(url);
    };

    /**
     * Updates a user for/from a certain account.
     * @function updateUserForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} userId
     * @param {object} updates - Valid JSON encoded array of updates
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>}
     */
    updateUserForAccount = async (accountId, userId, updates) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!userId) {
            throw 'Please give a user ID';
        }

        if (!updates) {
            throw 'Please give the a valid JSON encoded array of updates. See docs for more info.';
        }

        let url = new URL(`/${accountId}/settings/user/${userId}`, EngageApi.baseUrl);

        const body = {
            updates: updates,
        };

        return await this.request(
            url,
            'post',
            null,
            body,
        );
    };

    /**
     * Deletes a user for/from a certain account.
     * @function deleteUserForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} userId
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>}
     */
    deleteUserForAccount = async (accountId, userId) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!userId) {
            throw 'Please give a user ID';
        }

        let url = new URL(`/${accountId}/settings/user/${userId}`, EngageApi.baseUrl);

        return await this.request(
            url,
            'delete',
        );
    };

    /**
     * Returns all the topics for a given account ID.
     * @function getTopicsForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} limit
     * @param {string} pageToken
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>}
     */
    getTopicsForAccount = async (accountId, limit, pageToken) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/topics/`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'limit': limit,
            'page_token': pageToken,
        });

        return await this.request(url);
    };

    /**
     * Returns the list of Teams for a certain account.
     * @function getTeamsForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} limit
     * @param {string} pageToken
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>}
     */
    getTeamsForAccount = async (accountId, limit, pageToken) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/teams/`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'limit': limit,
            'page_token': pageToken,
        });

        return await this.request(url);
    };

    /**
     * Adds a new Team for a certain account.
     * @function addTeamForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} team
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>}
     */
    addTeamForAccount = async (accountId, team) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!team) {
            throw 'Please give the JSON encoded array of a Team you want to make. See docs for more info.';
        }

        let url = new URL(`/${accountId}/settings/teams/`, EngageApi.baseUrl);

        const body = {
            team: team,
        };

        return await this.request(
            url,
            'post',
            null,
            body
        );
    };

    /**
     * Return a single Team object.
     * @function getTeamForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} teamId
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>}
     */
    getTeamForAccount = async (accountId, teamId) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!teamId) {
            throw 'Please give a team ID';
        }

        let url = new URL(`/${accountId}/settings/team/${teamId}`, EngageApi.baseUrl);

        return await this.request(url);
    };

    /**
     * Update a team for account.
     * @function updateTeamForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} teamId
     * @param {object} updates
     * @param {object} [options=null]
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>}
     */
    updateTeamForAccount = async (accountId, teamId, updates, options = null) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!teamId) {
            throw 'Please give a team ID';
        }

        if (!updates) {
            throw 'Please give a JSON encoded array of changes you want to make.';
        }

        let url = new URL(`/${accountId}/settings/team/${teamId}`, EngageApi.baseUrl);

        const body = {
            updates: updates,
            options: options,
        };

        return await this.request(
            url,
            'post',
            null,
            body
        );
    };

    /** Dashboard API calls **/

    /**
     * Returns the data for a single widget from a dashboard.
     * Please be aware that when using this endpoint, the format of the data returned for the widget is not fixed. Different widgets return data in different formats, and its schemas are undocumented & unversioned. This endpoint is provided as is.
     * @function getDashboardWidgetData
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} dashboardId
     * @param {string} componentId
     * @param {string} [filter] - A filter query string.
     * @param {string} [dateFrom] - ISO 8601 formatted date, defaults to 28 days ago.
     * @param {string} [dateTo] - ISO 8601 formatted date, defaults to now.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A single dashboard item.
     */
    getDashboardWidgetData = async (accountId, dashboardId, componentId, filter, dateFrom, dateTo) => {
        // TODO get or post?
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!dashboardId) {
            throw 'Please give a dashboard ID';
        }

        if (!componentId) {
            throw 'Please give a component ID';
        }

        let url = new URL(`/${accountId}/dashboards/component/${dashboardId}/${componentId}`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'filter': filter,
            'date_from': dateFrom,
            'date_to': dateTo,
        });

        return await this.request(url);
    };

    /**
     * Return the data for all widgets from a specific dashboard.
     * Please be aware that when using this endpoint, the format of the data returned for the widget is not fixed. Different widgets return data in different formats, and its schemas are undocumented & unversioned. This endpoint is provided as is.
     * @function getWidgetDataFromDashboard
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} dashboardId
     * @param {string} [filter] - A filter query string.
     * @param {string} [dateFrom] - ISO 8601 formatted date, defaults to 28 days ago.
     * @param {string} [dateTo] - ISO 8601 formatted date, defaults to now.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A single dashboard_widget item.
     */
    getWidgetDataFromDashboard = async (accountId, dashboardId, filter, dateFrom, dateTo) => {
        // TODO get or post?
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!dashboardId) {
            throw 'Please give a dashboard ID';
        }

        let url = new URL(`/${accountId}/dashboards/export/${dashboardId}`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'filter': filter,
            'date_from': dateFrom,
            'date_to': dateTo,
        });

        return await this.request(url);
    };

    /**
     * Returns a list of all dashboards for an account.
     * @function getDashboards
     * @memberOf EngageApi
     * @param {string} accountId
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - Array of dashboard items.
     */
    getDashboards = async (accountId, filter, dateFrom, dateTo) => {
        // TODO get or post?
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/dashboards/overview`, EngageApi.baseUrl);

        return await this.request(url);
    };
    /** end Dashboard API calls **/

    /** Filter API calls **/

    /**
     * Get all the filter options available in the inbox filter. By passing a query, you can search for specific filter-options.
     * @function getFilterOptions
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [query] - Search for a specific filter-option (e.g. By passing the name of a user).
     * @param {string} [limit] - Amount of suggestions to return. (Allowed: 1 to 2000.)
     * @param {string} [pageToken]
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - Array of filter_suggestion items.
     */
    getFilterOptions = async (accountId, query, limit, pageToken) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/filter/suggestions`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'limit': limit,
            'page_token': pageToken,
            'query': query,
        });

        return await this.request(url);
    };

    /** end Filter API calls **/


    /** Insights API calls **/

    /**
     * Returns statistical data about your mentions. Useful for showing charts or summary tables about your data. (Enable your developer account and go to the API Parameters tab in the Chart Builder in the application to see examples.)
     * @function getInsights
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} facetDefinitions - A json encoded array of facetdefinition objects.
     * @param {string} [filter] - A filter query string to return only data that matches a certain filter.
     * @param {string} [dateFrom] - ISO 8601 formatted date, defaults to 28 days ago.
     * @param {string} [dateTo] - ISO 8601 formatted date, defaults to now.
     * @param {string} [topicIds] - Comma separated list of topic ids to search in. Required for facets of type "mentions".
     * @param {string} [profileIds] - Comma separated list of monitored profiles ids. Required for facets of type "monitored profile kpis".
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - Array of facet items.
     */
    getInsights = async (accountId, facetDefinitions, filter, dateFrom, dateTo, topicIds, profileIds) => {
        // TODO post or get?
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!facetDefinitions) {
            throw 'Please give a json encoded array of facetdefinition objects.';
        }

        let url = new URL(`/${accountId}/insights/facets`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'limit': limit,
            'page_token': pageToken,
            'query': query,
        });

        return await this.request(url);
    };

    /** end Insights API calls **/

    /** Security API calls **/

    /**
     * Returns the security audit logs for an account.
     * @function getSecurityLogsForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [dateFrom] - ISO 8601 formatted date, defaults to 28 days ago.
     * @param {string} [dateTo] - ISO 8601 formatted date, defaults to now.
     * @param {string} [events] - Comma separated list of security events. If empty: shows all event types. Possible values are 'password_change', 'login_success', 'login_failure', 'logout', 'account_locked', 'account_unlocked', 'settings_edited', 'password_reset'
     * @param {string} [userId] - Id of the user who did the changes. If empty: changes for all users.
     * @param {string} [pageToken] - Paging parameter.
     * @param {string} [limit] - Amount of audit log items to return. (Max: 200)
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of audit_log_item items.
     */
    getSecurityLogsForAccount = async (accountId, dateFrom, dateTo, events, userId, pageToken, limit) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/security/audit`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'date_from': dateFrom,
            'date_to': dateTo,
            'events': events,
            'user_id': userId,
            'page_token': pageToken,
            'limit': limit,
        });

        return await this.request(url);
    };

    /** end Security API calls **/

    /** Crisis API calls **/

    /**
     * Enable or disable a crisis plan.
     * @function toggleCrisisPlan
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} planId - Id of a crisis plan
     * @param {boolean} activate - Indicate if a crisis plan should be enabled or disabled
     * @param {string} [crisis_name=''] - Name of new crisis event
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A crisis_plan object
     */
    toggleCrisisPlan = async (accountId, planId, activate, crisis_name = '') => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!planId) {
            throw 'Please give a valid Crisis plan ID';
        }

        if (typeof activate === 'undefined') {
            throw 'Please indicate whether you want to activate the Crisis plan or not';
        }

        let url = new URL(`/${accountId}/crisis/event/`, EngageApi.baseUrl);

        const body = {
            id: planId,
            activate: activate,
            crisis_name: crisis_name,
        };

        return await this.request(
            url,
            'post',
            null,
            body
        );
    };

    /**
     * Returns the crisis plans of an account.
     * @function getCrisisPlanForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} activeOnly - Set "1" to show active plans only
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A list of crisis_plan items.
     */
    getCrisisPlanForAccount = async (accountId, activeOnly) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }
        let url = new URL(`/${accountId}/crisis/plans`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'active_only': activeOnly,
        });

        return await this.request(url);
    };

    /**
     * Mark a to do-item as done or to do for a crisis in an account.
     * @function toggleCrisisPlan
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} planId - Id of a crisis plan
     * @param {boolean} todoId - Id of a to do-item
     * @param {string} done -Indicate if a to do-item should be marked as done or to do
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A crisis_plan object
     */
    toggleTodoForAccount = async (accountId, planId, todoId, done) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!planId) {
            throw 'Please give a valid Crisis plan ID';
        }

        if (!todoId) {
            throw 'Please give a valid Crisis plan ID';
        }

        if (typeof done === 'undefined') {
            throw 'Please indicate whether you want to set the Todo as done';
        }

        let url = new URL(`/${accountId}/crisis/todo/`, EngageApi.baseUrl);

        const body = {
            plan_id: planId,
            todo_id: todoId,
            done: done,
        };

        return await this.request(
            url,
            'post',
            null,
            body
        );
    };
    /** end Crisis API calls **/

    /** Tools API calls **/

    /**
     * Will try to determine mentioned places (city, region and/or country) in a given string.
     * @function getGeoLocationsFromString
     * @memberOf EngageApi
     * @param {string} string - The string you want to analyze.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - List of location items.
     */
    getGeoLocationsFromString = async (string) => {
        let url = new URL(`/tools/geocode`, EngageApi.baseUrl);

        // @TODO Not sure if GET or POST
        url = this.addQueryParams(url, {
            'string': string,
        });

        return await this.request(url);
    };

    /**
     * Will try to determine the language a given string is written in.
     * @function getLanguageFromString
     * @memberOf EngageApi
     * @param {string} string - The string you want to analyze.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A single language item
     */
    getLanguageFromString = async (string) => {
        let url = new URL(`/tools/geocode`, EngageApi.baseUrl);

        // @TODO Not sure if GET or POST
        url = this.addQueryParams(url, {
            'string': string,
        });

        return await this.request(url);
    };

    /**
     * Will try to determine the sentiment of a given string.
     * @function getSentimentFromString
     * @memberOf EngageApi
     * @param {string} string - The string you want to analyze. Pass in a JSON encoded array to analyze up to 50 messages at a time.
     * @param {string} [language=''] - The ISO 639-1 language code of the string you want to analyze. If none given, we will try and detect the language.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A score integer; 0 is a neutral sentiment, higher is positive, lower is negative. Endpoint will return indexed array of scores (or null on error) when you're passing in multiple strings.
     */
    getSentimentFromString = async (string, language = '') => {
        let url = new URL(`/tools/geocode`, EngageApi.baseUrl);

        // @TODO Not sure if GET or POST
        url = this.addQueryParams(url, {
            'string': string,
            'language': language,
        });

        return await this.request(url);
    };


    /** end Tools API calls **/

    /** User API calls **/

    /**
     * Returns details about the currently logged in user. Use this function to identify who authorized your application.
     * @function getCurrentlyLoggedInUser
     * @memberOf EngageApi
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A single user item.
     */
    getCurrentlyLoggedInUser = async () => {
        let url = new URL(`/me`, EngageApi.baseUrl);

        return await this.request(url);
    };

    /**
     * Returns a list of accounts (and associated projects, topics and monitored profiles) the logged in user has access to.
     * @function getCurrentlyLoggedInUserAccounts
     * @memberOf EngageApi
     * @param {string} limit
     * @param {string} pageToken
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of account items
     */
    getCurrentlyLoggedInUserAccounts = async (limit, pageToken) => {
        let url = new URL(`/me/accounts`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'limit': limit,
            'page_token': pageToken,
        });

        return await this.request(url);
    };

    /**
     * Returns a list of the connected profiles for the authenticated user.
     * @function getCurrentlyLoggedInUserConnectedProfiles
     * @memberOf EngageApi
     * @param {string} limit
     * @param {string} pageToken
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of connectedprofile items
     */
    getCurrentlyLoggedInUserConnectedProfiles = async (limit, pageToken) => {
        let url = new URL(`/me/connectedprofiles`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            'limit': limit,
            'page_token': pageToken,
        });

        return await this.request(url);
    };

    /**
     * Returns a list of permissions your application has for the currently logged in user.
     * @function getCurrentlyLoggedInUserPermissions
     * @memberOf EngageApi
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - array
     */
    getCurrentlyLoggedInUserPermissions = async () => {
        let url = new URL(`/me/permissions`, EngageApi.baseUrl);

        return await this.request(url);
    };

    /** end User API calls **/

}

export default EngageApi;
