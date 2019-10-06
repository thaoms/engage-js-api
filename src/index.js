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
            limit: limit,
            page_token: pageToken,
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
            limit: limit,
            page_token: pageToken,
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
            limit: limit,
            page_token: pageToken,
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
            limit: limit,
            page_token: pageToken,
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

    /**
     * Deletes a Team for a certain account.
     * @function deleteTeamForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} teamId
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - Boolean that indicates if Team was deleted.
     */
    deleteTeamForAccount = async (accountId, teamId) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!teamId) {
            throw 'Please give a team ID';
        }

        let url = new URL(`/${accountId}/settings/team/${teamId}`, EngageApi.baseUrl);

        return await this.request(
            url,
            'delete',
        );
    };

    /**
     * Returns the list of tags for a certain account.
     * @function getTagsForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [limit] - Amount of mentions to return. (Allowed: 1 to 200.)
     * @param {string} [pageToken] - Paging parameter.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of tag items.
     */
    getTagsForAccount = async (accountId, limit, pageToken) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/tags`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            limit: limit,
            page_token: pageToken,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Returns the list of the publishing guidelines for an account.
     * @function getPublishingGuidelinesForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [limit] - Amount of mentions to return. (Allowed: 1 to 200.)
     * @param {string} [pageToken] - Paging parameter.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} -array paged_list of publishing_guideline items.
     */
    getPublishingGuidelinesForAccount = async (accountId, limit, pageToken) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/publishing_guidelines`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            limit: limit,
            page_token: pageToken,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Returns the list of Social Profile Groups for a certain account.
     * @function getSocialProfileGroupsForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [limit] - Amount of mentions to return. (Allowed: 1 to 200.)
     * @param {string} [pageToken] - Paging parameter.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} -a paged_list of profile_group items.
     */
    getSocialProfileGroupsForAccount = async (accountId, limit, pageToken) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/profilegroups`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            limit: limit,
            page_token: pageToken,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Returns the list of Social Profile Groups for a certain account.
     * @function addSocialProfileGroupForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {object} profileGroup - A JSON encoded array of a Social Profile Group you want to make. Structure of the object should be like profile_group.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - profile_group The new Social Profile Group.
     */
    addSocialProfileGroupForAccount = async (accountId, profileGroup) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!profileGroup) {
            throw 'Please give a JSON encoded array of a Social Profile Group';
        }

        let url = new URL(`/${accountId}/settings/profilegroups`, EngageApi.baseUrl);

        const body = {
            profile_group: profileGroup,
        };

        return await this.request(
            url,
            'post',
            null,
            body,
        );
    };

    /**
     * Edit a Social Profile Group for a certain account. When you provide profiles, these will replace the current profiles of the Social Profile Group
     * @function addSocialProfileGroupForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {object} groupId
     * @param {object} updates - A JSON encoded array of changes you want to make. Structure of the object should be like profile_group, with only those properties you want to update
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - profile_group The new Social Profile Group.
     */
    addSocialProfileGroupForAccount = async (accountId, groupId, updates) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!groupId) {
            throw 'Please give a valid group id';
        }

        if (!updates) {
            throw 'Please give a JSON encoded array of changes you want to make';
        }

        let url = new URL(`/${accountId}/settings/profilegroup/${groupId}`, EngageApi.baseUrl);

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
     * Deletes a Social Profile Group for a certain account.
     * @function deleteSocialProfileGroupForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {object} groupId
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - Boolean that indicates if Social Profile Group was deleted.
     */
    deleteSocialProfileGroupForAccount = async (accountId, groupId) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!groupId) {
            throw 'Please give a valid group id';
        }

        let url = new URL(`/${accountId}/settings/profilegroup/${groupId}`, EngageApi.baseUrl);

        return await this.request(
            url,
            'delete',
        );
    };

    /**
     * Returns the audit log with settings changes to the account.
     * @function getAuditLogSettingsChangesForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {object} [dateFrom=null] - ISO 8601 formatted date, defaults to 28 days ago.
     * @param {object} [dateTo=null] - ISO 8601 formatted date, defaults to now.
     * @param {string} [types=''] - Comma separated list of types of changes. See response documentation for possible values. If empty: changes for all types.
     * @param {string} [topicIds=''] - Comma separated list of topic ids to search in. If empty: changes for all topics.
     * @param {string} [userId=''] - Id of the user who did the changes. If empty: changes for all users.
     * @param {string} [pageToken=''] - Paging parameter.
     * @param {string} [limit=''] - Amount of history items to return. (Allowed: 1 to 200).
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of history_item items.
     */
    getAuditLogSettingsChangesForAccount = async (accountId, dateFrom = null, dateTo = null, types = '', topicIds = '', userId = '', pageToken = '', limit = '') => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/history`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            date_from: dateFrom,
            date_to: dateTo,
            types: types,
            topic_ids: topicIds,
            user_id: userId,
            page_token: pageToken,
            limit: limit,
        });

        return await this.request(url);
    };

    /**
     * Returns the list of custom attributes/contact fields for an account.
     * @function getCustomFieldsForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [limit] - Amount of mentions to return. (Allowed: 1 to 200.)
     * @param {string} [pageToken] - Paging parameter.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of contact_customattributes items (without the "value" property).
     */
    getCustomFieldsForAccount = async (accountId, limit, pageToken) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/customattributes`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            limit: limit,
            page_token: pageToken,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Returns a list of folders of the canned responses.
     * @function getCannedReponsesFoldersForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [limit] - Amount of canned responses to return. (Allowed: 1 to 50).
     * @param {string} [pageToken] - Paging parameter.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of canned_response_folder items.
     */
    getCannedReponsesFoldersForAccount = async (accountId, limit, pageToken) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/canned_responses_folders`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            limit: limit,
            page_token: pageToken,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Returns a list of canned responses.
     * @function getCannedResponsesForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [limit] - Amount of canned responses to return. (Allowed: 1 to 50).
     * @param {string} [pageToken] - Paging parameter.
     * @param {string} [topicId=''] - The topic ID of the mention
     * @param {string} [ymid=''] - The YMID of the mention
     * @param {string} [query=''] - Search for specific words in the canned responses
     * @param {object} [folderIds={}] - A JSON encoded array of the ids of the folders you want to filter on
     * @param {string} [order=''] - The sorting order (Alphabetically A-Z: sort_alpha_asc, Alphabetically Z-A: sort_alpha_desc, TYPE A-Z: sort_type_asc, TYPE Z-A: sort_type_desc, Least Frequently Used: sort_used_count_asc, Most Frequently Used: sort_used_count_desc, Most Recently Created: sort_most_recently_created, Least Recently Created: sort_least_recently_created, Most Recently Updated: sort_most_recently_updated)
     * @param {string} [replyType=''] - The reply type (post, privatemessage, comment, ...)
     * @param {string} [serviceType=''] - The type of the service (This parameter is needed for [profile.name] and [profile.url])
     * @param {string} [serviceId=''] - The ID of the service (This parameter is needed for [profile.name] and [profile.url])
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of canned_response items.
     */
    getCannedResponsesForAccount = async (accountId, limit, pageToken, topicId = '', ymid = '', query = '', folderIds = {}, order = '', replyType = '', serviceType = '', serviceId = '') => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/canned_responses`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            limit: limit,
            page_token: pageToken,
            topic_id: topicId,
            ymid: ymid,
            query: query,
            folder_ids: folderIds,
            order: order,
            reply_type: replyType,
            service_type: serviceType,
            service_id: serviceId,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Returns the list of Business Hours Schedules for a certain account.
     * @function getBusinessHoursScheduleForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [limit] - Amount of canned responses to return. (Allowed: 1 to 50).
     * @param {string} [pageToken] - Paging parameter.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of business_hours_schedule items.
     */
    getBusinessHoursScheduleForAccount = async (accountId, limit, pageToken) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/settings/businesshoursschedules`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            limit: limit,
            page_token: pageToken,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Add a new Business Hours Schedule for a certain account.
     * @function addBusinessHoursScheduleForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {object} businessHoursSchedule - A JSON encoded array of a Business Hours Schedule you want to make. Structure of the object should be like business_hours_schedule. Eg. {"name":"My schedule","timezone":"Europe/Brussels","periods":[{"dayofweek":1,"start":"0900","end":"1500"},{"dayofweek":1,"start":"1600","end":"2200"},{"dayofweek":2,"start":"0900","end":"2300"}]}
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - business_hours_schedule The new Business Hours Schedule.
     */
    addBusinessHoursScheduleForAccount = async (accountId, businessHoursSchedule) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!businessHoursSchedule) {
            throw 'Please give a valid JSON encoded array of a Business Hours Schedule you want to make.';
        }

        let url = new URL(`/${accountId}/settings/businesshoursschedules`, EngageApi.baseUrl);

        const body = {
            business_hours_schedule: businessHoursSchedule,
        };

        return await this.request(
            url,
            'post',
            null,
            body,
        );
    };

    /**
     * Edit a business hours schedule for a certain account.
     * @function editBusinessHoursScheduleForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} id
     * @param {object} updates - A JSON encoded array of changes you want to make. Structure of the object should be like business_hours_schedule, with only those properties you want to update.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - business_hours_schedule The updated Business Hours Schedule object.
     */
    editBusinessHoursScheduleForAccount = async (accountId, id, updates) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!id) {
            throw 'Please give a valid Business Hours Schedule ID.';
        }

        if (!updates) {
            throw 'Please give a valid JSON encoded array of changes you want to make.';
        }

        let url = new URL(`/${accountId}/settings/businesshoursschedules/${id}`, EngageApi.baseUrl);

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
     * Deletes a business hours schedule for a certain account.
     * @function deleteBusinessHoursScheduleForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} id
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - Boolean that indicates if business hours schedule was deleted.
     */
    deleteBusinessHoursScheduleForAccount = async (accountId, id) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!id) {
            throw 'Please give a valid Business Hours Schedule ID.';
        }

        let url = new URL(`/${accountId}/settings/businesshoursschedules/${id}`, EngageApi.baseUrl);

        return await this.request(
            url,
            'delete',
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
            filter: filter,
            date_from: dateFrom,
            date_to: dateTo,
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
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!dashboardId) {
            throw 'Please give a dashboard ID';
        }

        let url = new URL(`/${accountId}/dashboards/export/${dashboardId}`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            filter: filter,
            date_from: dateFrom,
            date_to: dateTo,
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
            limit: limit,
            page_token: pageToken,
            query: query,
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
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!facetDefinitions) {
            throw 'Please give a json encoded array of facetdefinition objects.';
        }

        let url = new URL(`/${accountId}/insights/facets`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            facetdefinitions: facetDefinitions,
            filter: filter,
            date_from: dateFrom,
            date_to: dateTo,
            topic_ids: topicIds,
            profile_ids: profileIds,
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
            date_from: dateFrom,
            date_to: dateTo,
            events: events,
            user_id: userId,
            page_token: pageToken,
            limit: limit,
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
            active_only: activeOnly,
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

        url = this.addQueryParams(url, {
            string: string,
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

        url = this.addQueryParams(url, {
            string: string,
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

        url = this.addQueryParams(url, {
            string: string,
            language: language,
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
            limit: limit,
            page_token: pageToken,
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
            limit: limit,
            page_token: pageToken,
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


    /** Inbox API calls **/

    /**
     * Add new mentions to your topic (in bulk).
     * @function addMentionsToTopicForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {object} mentions - A JSON encoded array of mention items your want to add to your topic. (Maximum of 500.)
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - bool Were all mentions added successfully?
     */
    addMentionsToTopicForAccount = async (accountId, mentions) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!mentions) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/inbox/add`, EngageApi.baseUrl);

        const body = {
            mentions: mentions,
        };

        return await this.request(
            url,
            'post',
            null,
            body
        );
    };

    /**
     * Returns a single social profile / contact. You can fetch a contact by its contact.id, or by using service ("twitter", "facebook", ...) & service_id (id of the user on the platform). (These values are returned as contact.socialprofiles[].type and contact.socialprofiles[].service_id on contact objects.)
     * @function getSocialProfileForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} contactId
     * @param {object} [topicIds=null] - Comma separated list of topic ids to search for details.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A single contact item.
     */
    getSocialProfileForAccount = async (accountId, contactId, topicIds = null) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!contactId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/inbox/contact/${contactId}`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            topics_ids: topicIds,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Updates a single social profile / contact. You can update a contact by its contact.id, or by using service ("twitter", "facebook", ...) & service_id (id of the user on the platform). (These values are returned as contact.socialprofiles[].type and contact.socialprofiles[].service_id on contact objects.)
     * @function updateSocialProfileForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} contactId
     * @param {object} updates - A JSON encoded array of changes you want to make. Structure of the object should be like contact, with only those properties you want to update. (Property `socialprofiles` can't be updated.)
     * @param {object} [options=null] - A JSON encoded array of options for the update. Supported keys: 'customattributes_edit_mode' (possible values: 'update', 'overwrite' or 'delete'; 'update' is default), 'tags_edit_mode' (possible values: 'add', 'update', or 'delete'; 'update' is default)
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - The updated contact item.
     */
    updateSocialProfileForAccount = async (accountId, contactId, updates, options = null) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!contactId) {
            throw 'Please give an account ID';
        }

        if (!updates) {
            throw 'Please give a JSON encoded array of changes you want to make.';
        }

        let url = new URL(`/${accountId}/inbox/contact/${contactId}`, EngageApi.baseUrl);

        const body = {
            updates: updates,
            options: options,
        };

        return await this.request(
            url,
            'post',
            null,
            body,
        );
    };

    /**
     * Deletes a social profile / contact.
     * @function deleteSocialProfileForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} contactId
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - Boolean that indicates if contact details were deleted.
     */
    deleteSocialProfileForAccount = async (accountId, contactId, updates, options = null) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!contactId) {
            throw 'Please give an account ID';
        }

        if (!updates) {
            throw 'Please give a JSON encoded array of changes you want to make.';
        }

        let url = new URL(`/${accountId}/inbox/contact/${contactId}`, EngageApi.baseUrl);

        return await this.request(
            url,
            'delete',
        );
    };

    /**
     * Returns a single social profile / contact. You can fetch a contact by its contact.id, or by using service ("twitter", "facebook", ...) & service_id (id of the user on the platform). (These values are returned as contact.socialprofiles[].type and contact.socialprofiles[].service_id on contact objects.)
     * @function getSocialProfileForAccountByService
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} service
     * @param {string} serviceId
     * @param {object} [topicIds=null] - Comma separated list of topic ids to search for details.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A single contact item.
     */
    getSocialProfileForAccountByService = async (accountId, service, serviceId, topicIds) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!service) {
            throw 'Please give a valid service';
        }

        if (!serviceId) {
            throw 'Please give a valid service id';
        }

        let url = new URL(`/${accountId}/inbox/contact/${service}/${serviceId}`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            topics_ids: topicIds,
        });

        return await this.request(url);
    };

    /**
     * Returns a single social profile / contact. You can fetch a contact by its contact.id, or by using service ("twitter", "facebook", ...) & service_id (id of the user on the platform). (These values are returned as contact.socialprofiles[].type and contact.socialprofiles[].service_id on contact objects.)
     * @function updateSocialProfileForAccountByService
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} service
     * @param {string} serviceId
     * @param {object} updates - A JSON encoded array of changes you want to make. Structure of the object should be like contact, with only those properties you want to update. (Property `socialprofiles` can't be updated.)
     * @param {object} [options=null] - A JSON encoded array of options for the update. Supported keys: 'customattributes_edit_mode' (possible values: 'update', 'overwrite' or 'delete'; 'update' is default), 'tags_edit_mode' (possible values: 'add', 'update', or 'delete'; 'update' is default)
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - The updated contact item.
     */
    updateSocialProfileForAccountByService = async (accountId, service, serviceId, updates, options) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!service) {
            throw 'Please give a valid service';
        }

        if (!serviceId) {
            throw 'Please give a valid service id';
        }

        if (!updates) {
            throw 'Please give a JSON encoded array of changes you want to make.';
        }

        let url = new URL(`/${accountId}/inbox/contact/${service}/${serviceId}`, EngageApi.baseUrl);

        const body = {
            updates: updates,
            options: options,
        };

        return await this.request(
            url,
            'post',
            null,
            body,
        );
    };

    /**
     * Returns a list of contacts ordered by contact.id
     * @function getContactsForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {object} [requiredFields=null] - A JSON encoded array of fields that should be filled in for the returned contact objects. Possible values: "email", "name", "company", "phone"
     * @param {string} [filter=null] - Optional filter rule for returned contacts. (Currently only filters of type `contacttag:tagname` are supported. `AND`, `OR` and `NOT`-clauses are also not supported yet.)
     * @param {string} [updatedSince] - Optional ISO 8601 formatted date. When set, only contacts updated after this time will be returned.
     * @param {string} [pageToken] - Paging parameter.
     * @param {string} [limit] - Amount of contacts to return (default 20, min 0, max 50).
     * @param {string} [sort] - Ordering of the contacts. Possible options: `dateadd:asc`, `dateadd:desc`, `lastupdate:asc`, `lastupdate:desc`
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of contact items, ordered by contact.id
     */
    getContactsForAccount = async (accountId, requiredFields = null, filter = '', updatedSince, pageToken, limit, sort) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/inbox/contacts`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            required_fields: requiredFields,
            filter: filter,
            updated_since: updatedSince,
            page_token: pageToken,
            limit: limit,
            sort: sort,
        });

        return await this.request(url);
    };

    /**
     * Receive the context history of a mention.
     * @function getContextHistoryOfMentionForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} topicId
     * @param {string} id
     * @param {string} [dateFrom] - ISO 8601 formatted date, defaults to 28 days ago.
     * @param {string} [dateTo] - ISO 8601 formatted date, defaults to now.
     * @param {string} [contextType='conversation'] - 	How you want to receive the list of mentions. Default this option is `conversation`. Other possibilities are: `conversation_with_you`, `notes` and `privatemessages`
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A list of context-objects
     */
    getContextHistoryOfMentionForAccount = async (accountId, topicId, id, dateFrom, dateTo, contextType = 'conversation') => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!topicId) {
            throw 'Please give a valid topic ID';
        }

        if (!id) {
            throw 'Please give a valid ID';
        }

        let url = new URL(`/${accountId}/inbox/context/${topicId}/${id}`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            date_from: dateFrom,
            date_to: dateTo,
            context_type: contextType,
        });

        return await this.request(url);
    };

    /**
     * Returns the mailboxes configuration
     * @function getMailboxesConfiguration
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [pageToken] - Paging parameter.
     * @param {string} [limit='20'] - Amount of mailboxes to return.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of mailbox items.
     */
    getMailboxesConfiguration = async (accountId, pageToken, limit = '20') => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/inbox/mailboxes`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            page_token: pageToken,
            limit: limit,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Returns a single mention object.
     * @function getMention
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} topicId
     * @param {string} id
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A single mention item.
     */
    getMention = async (accountId, topicId, id) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!topicId) {
            throw 'Please give a valid topic ID';
        }

        if (!id) {
            throw 'Please give a valid ID';
        }

        let url = new URL(`/${accountId}/inbox/mention/${topicId}/${id}`, EngageApi.baseUrl);

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Updates a single mention object. Use version 20160108 to use the sendMail option
     * @function updateMention
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} topicId
     * @param {string} id
     * @param {object} [updates=null] - 	A JSON encoded object of changes you want to make. Structured as a mention item, but with only the keys you want to update.
     (See examples for supported updates.)
     * @param {string} [listFilter=''] - Check if the updated mention still fits in this optional filter
     * @param {object} [options=null] - A JSON encoded object of options for the update. Supported keys: "tags_edit_mode", "sendMail", "hide_on_service", "delete_on_service"
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - The updated mention item.
     */
    updateMention = async (accountId,  topicId, id, updates = null, listFilter = '', options = null) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/inbox/mention/${topicId}/${id}`, EngageApi.baseUrl);

        const body = {
            updates: updates,
            list_filter: listFilter,
            options: options,
        };

        return await this.request(
            url,
            'post',
            null,
            body,
        );
    };

    /**
     * Deletes a single mention object.
     * @function deleteMention
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} topicId
     * @param {string} id
     * @param {object} [options=null] - A JSON encoded object of options. Supported keys: "delete_on_service", "hide_on_service", "block_author_on_service" actions to perform together with the delete
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - boolean true if delete succeeded
     */
    deleteMention = async (accountId, topicId, id, options = null) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!topicId) {
            throw 'Please give a valid topic ID';
        }

        if (!id) {
            throw 'Please give a valid ID';
        }

        let url = new URL(`/${accountId}/inbox/mention/${topicId}/${id}`, EngageApi.baseUrl);

        const body = {
            options: options,
        };

        return await this.request(
            url,
            'delete',
            null,
            body,
        );
    };

    /**
     * Returns mentions from the inbox (for a certain filter).
     * @function getMentionsForAccount
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [filter] - A filter query string.
     * @param {string} [dateFrom] - ISO 8601 formatted date, defaults to 28 days ago.
     * @param {string} [dateTo] - ISO 8601 formatted date, defaults to now.
     * @param {string} [topicIds] - Comma separated list of topic ids to search in. If empty: default inbox selection for user.
     * @param {string} [pageToken] - Paging parameter.
     * @param {string} [limit] - Amount of mentions to return (default 20, min 0, max 100).
     * @param {string} [sort] - How to sort the mentions. The value of the sort parameter should be one of the following: dateadd:desc, dateadd:asc, followers:desc, timestamps.action_reply_first:desc, timestamps.action_reply_first_in_bh:desc, timestamps.action_status_last:desc, timestamps.action_last_date:desc
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of mention items.
     */
    getMentionsForAccount = async (accountId, filter, dateFrom, dateTo, topicIds, pageToken, limit, sort) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/inbox/mentions`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            filter: filter,
            date_from: dateFrom,
            date_to: dateTo,
            topic_ids: topicIds,
            page_token: pageToken,
            limit: limit,
            sort: sort,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Returns a list of services, and associated configuration options, for publishing new messages on your social profiles.
     Note: The action_links property of a mention contains a "link" (type "api" with eg. key "reply") that has the parameters for this API call prefilled.
     Note 2: We cannot expose real publishing functionality in our API per third-party terms of service agreements (eg. Twitter Api Rules), so only creating drafts, or queueing messages for approval is exposed to non-Engagor applications.
     * @function getPublisherServicesAndOptions
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} type - The type of action you want to do. To publish a new tweet or message use 'post', other options include 'reply' (eg. Twitter replies), 'privatemessage', 'comment' (eg. Facebook comments), 'like', 'favorite', 'retweet', 'reblog', 'submit' (Tumblr).
     * @param {string} topicId - The topic's id of the mention you want to reply to.
     * @param {string} mentionId - The id of the mention you want to reply to.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - Object with:
     a list of possible services to post to (including details about the rights for that profile, the displayname and avatar of the profile, and whether or not certain features like photo uploading are available or not),
     some configuration options regarding the message's length, cursor position, default text
     and, if applicable, details of the mention you're reply to.
     */
    getPublisherServicesAndOptions = async (accountId, type, topicId, mentionId) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/publisher/add`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            type: type,
            topic_id: topicId,
            mention_id: mentionId,
        });

        return await this.request(
            url,
            'get',
        );
    };


    /**
     * Publishes a new message to one or more of social profiles (create drafts and send messages for approval).
     Note: The action_links property of a mention contains a "link" (type "api" with eg. key "reply") that has the parameters for this API call prefilled.
     Note 2: We cannot expose real publishing functionality in our API per third-party terms of service agreements (eg. Twitter Api Rules), so only creating drafts, or queueing messages for approval is exposed to non-Engagor applications.
     * @function updatePublisherServicesAndOptions
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} type - The type of action you want to do. To publish a new tweet or message use 'post', other options include 'reply' (eg. Twitter replies), 'privatemessage', 'comment' (eg. Facebook comments), 'like', 'favorite', 'retweet', 'reblog', 'submit' (Tumblr).
     * @param {object} services - A JSON encoded array of items with properties 'type' and 'service_id'. One or more services you want to publish to (any of the services retrieved by GET /:account_id/publisher/add). Eg. '[{"type":"facebook","service_id":"999999999999"}]'
     * @param {object} [to] - A JSON encoded array of items with property 'id'. Eg. '[{"id":"info@abstergostore.com"},{"id":"no-reply@abstergostore.com"}]'
     * @param {string} [subject] - The text of the subject to post.
     * @param {string} [message] - The text of the message to post.
     * @param {string} [status] - The status the message will be in; possible values are 'draft' or 'awaitingapproval'.
     * @param {string} [datePublish] - ISO 8601 formatted date to publish the item. (Leave empty for 'now'.)
     * @param {string} [topicId] - The topic's id of the mention you want to reply to.
     * @param {string} [mentionId] - The id of the mention you want to reply to.
     * @param {object} [media] - 	A JSON encoded array of the ids returned from the media/add endpoint.
     * @param {string} [cannedResponseId] - 	Id of a canned response (The id is required for canned responses of the type CSAT, NPS® or Buttons). If the id is given, the number of usages will increase. If you use a canned response, the message of the response should be given in the message field and images should be added to the media field.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - An object contain both an array of message items and the publisher_mention item that was just created.
     */
    updatePublisherServicesAndOptions = async (accountId, services, to, subject, message, status, datePublish, type, topicId, mentionId, media, cannedResponseId) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!services) {
            throw 'Please give a JSON encoded array of items with properties \'type\' and \'service_id\'.';
        }

        let url = new URL(`/${accountId}/publisher/add`, EngageApi.baseUrl);

        const body = {
            type: type,
            services: services,
            to: to,
            subject: subject,
            message: message,
            status: status,
            date_publish: datePublish,
            topic_id: topicId,
            mention_id: mentionId,
            media: media,
            canned_response_id: cannedResponseId,
        };

        return await this.request(
            url,
            'post',
            null,
            body,
        );
    };

    /**
     * Returns a single publisher_mention object.
     * @function getPublisherMention
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} id
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - A single mention item.
     */
    getPublisherMention = async (accountId, id) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!id) {
            throw 'Please give an publisher mention ID';
        }

        let url = new URL(`/${accountId}/publisher/mention/${id}`, EngageApi.baseUrl);

        return await this.request(
            url,
            'get',
        );
    };

    /**
     * Updates a single publisher_mention object.
     * @function updatePublisherMention
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} id
     * @param {object} updates - A JSON encoded array of changes you want to make. Structured as a publisher_mention item, but with only the keys you want to update.
     * @param {object} [options=null] - A JSON encoded array of options for the update. Supported keys: "tags_edit_mode", "sendMail".
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - The updated publisher_mention item.
     */
    updatePublisherMention = async (accountId, id, updates, options = null) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        if (!id) {
            throw 'Please give an publisher mention ID';
        }

        if (!updates) {
            throw 'Please give a JSON encoded array of changes you want to make.';
        }

        let url = new URL(`/${accountId}/publisher/mention/${id}`, EngageApi.baseUrl);

        const body = {
            updates: updates,
            options: options,
        };

        return await this.request(
            url,
            'get',
            null,
            body,
        );
    };

    /**
     * Returns publisher_mention items in the inbox (for a certain filter).
     * @function getPublisherMentions
     * @memberOf EngageApi
     * @param {string} accountId
     * @param {string} [filter] - A filter query string.
     * @param {string} [topicIds] - Comma separated list of topic ids to search in. If empty: default inbox selection for user.
     * @param {string} [dateFrom] - ISO 8601 formatted date, defaults to 28 days ago.
     * @param {string} [dateTo] - ISO 8601 formatted date, defaults to now.
     * @param {string} [pageToken] - Paging parameter.
     * @param {string} [limit] - Amount of mentions to return.
     * @returns {Promise<Promise<*>|Promise<void>|ClientHttp2Stream|ClientRequest|*>} - paged_list of publisher_mention items.
     */
    getPublisherMentions = async (accountId, filter, topicIds, dateFrom, dateTo, pageToken, limit) => {
        if (!accountId) {
            throw 'Please give an account ID';
        }

        let url = new URL(`/${accountId}/publisher/mentions`, EngageApi.baseUrl);

        url = this.addQueryParams(url, {
            type: filter,
            topic_ids: topicIds,
            date_from: dateFrom,
            date_to: dateTo,
            page_token: pageToken,
            limit: limit,
        });

        return await this.request(
            url,
            'get',
        );
    };

    /** end Inbox API calls **/

}

export default EngageApi;
