import apiClient from './apiClient';

const getTickets = async (params = {}) => {
  const response = await apiClient.get('/support/tickets', { params });
  const payload = response.data;
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    items,
    page: payload?.page || 1,
    limit: payload?.limit || items.length || 10,
    total_items: payload?.total_items ?? items.length,
    total_pages: payload?.total_pages || 1,
  };
};

const getTicketMessages = async (ticketId) => {
  const response = await apiClient.get(`/support/tickets/${ticketId}`);
  return response.data?.ticket || response.data;
};

const createTicket = async (data) => {
  const payload = {
    subject: data.subject?.trim(),
    department: data.department?.trim() || 'فنی و پشتیبانی',
    priority: data.priority || 'normal',
    message: data.message?.trim(),
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
  };

  const response = await apiClient.post('/support/tickets', payload);
  return response.data;
};

const replyTicket = async (ticketId, data) => {
  const payload = {
    message: data.message?.trim(),
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
  };

  const response = await apiClient.post(
    `/support/tickets/${ticketId}/reply`,
    payload,
  );
  return response.data;
};

const getAdminTickets = async (params = {}) => {
  const response = await apiClient.get('/admin/support/tickets', { params });
  const payload = response.data;
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    items,
    page: payload?.page || 1,
    limit: payload?.limit || items.length || 10,
    total_items: payload?.total_items ?? items.length,
    total_pages: payload?.total_pages || 1,
  };
};

const updateTicketStatus = async (ticketId, status) => {
  const response = await apiClient.put(
    `/admin/support/tickets/${ticketId}/status`,
    { status },
  );
  return response.data;
};

export {
  createTicket,
  getAdminTickets,
  getTicketMessages,
  getTickets,
  replyTicket,
  updateTicketStatus,
};
