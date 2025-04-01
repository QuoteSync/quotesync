import { apiClient } from "@/api";
import { getSession } from "@/api";

export const QuoteGroupService = {
    async getGroups() {
        const response = await apiClient.get('/quote-groups/');
        return response.data;
    },

    async createGroup(groupData) {
        const session = await getSession();
        const response = await apiClient.post('/quote-groups/', {
            name: groupData.name,
            description: groupData.description,
            created_by: session.data.user.id,
            members: groupData.members || [] // Array of email addresses
        });
        return response.data;
    },

    async updateGroup(groupId, groupData) {
        const response = await apiClient.put(`/quote-groups/${groupId}/`, {
            name: groupData.name,
            description: groupData.description
        });
        return response.data;
    },

    async deleteGroup(groupId) {
        const response = await apiClient.delete(`/quote-groups/${groupId}/`);
        return response.data;
    },

    async addMember(groupId, email, role = 'reader') {
        const response = await apiClient.post(`/quote-groups/${groupId}/add_member/`, {
            email: email,
            role: role
        });
        return response.data;
    },

    async removeMember(groupId, email) {
        const response = await apiClient.delete(`/quote-groups/${groupId}/remove_member/`, {
            data: { email: email }
        });
        return response.data;
    },

    async shareQuoteWithGroup(quoteId, groupId, permission) {
        const response = await apiClient.post(`/quote-groups/${groupId}/shares/`, {
            quote: quoteId,
            permission: permission
        });
        return response.data;
    },

    async updateListVisibility(listId, visibility, groupId = null) {
        const response = await apiClient.patch(`/quote-lists/${listId}/`, {
            visibility: visibility,
            group: groupId
        });
        return response.data;
    },

    async makePublic(itemType, itemId) {
        const response = await apiClient.patch(`/${itemType}s/${itemId}/`, {
            visibility: 'public'
        });
        return response.data;
    },

    async makePrivate(itemType, itemId) {
        const response = await apiClient.patch(`/${itemType}s/${itemId}/`, {
            visibility: 'private'
        });
        return response.data;
    },

    async getPublicShares() {
        const response = await apiClient.get('/quote-groups/public/');
        return response.data;
    },

    async getSharedLists() {
        const response = await apiClient.get('/quote-lists/shared/');
        return response.data;
    }
}; 