import moment from 'moment'

export function isSubmittedResponse(response) {
    if (!response) return false;

    if (response.submit === true || response.submit === 1) return true;

    const normalized = String(response.submit || '').trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
}

export function getRangeStart(timeRange, now = moment()) {
    if (timeRange === '1d') {
        return now.clone().startOf('day');
    }
    
    if (timeRange === '30d') {
        return now.clone().startOf('day').subtract(29, 'days');
    }

    if (timeRange === '1y') {
        return now.clone().startOf('month').subtract(11, 'months');
    }

    return now.clone().startOf('day').subtract(6, 'days');
}

export function isInTimeRange(createdAt, timeRange, now = moment()) {
    if (timeRange === 'all') return true;
    if (!createdAt) return false;

    const date = moment(createdAt);
    if (!date.isValid()) return false;

    return date.isSameOrAfter(getRangeStart(timeRange, now), 'day');
}

export function getFilteredResponses(form, timeRange, now = moment()) {
    if (!form || !Array.isArray(form.responses)) return [];

    const submittedResponses = form.responses.filter((response) => isSubmittedResponse(response));
    const hasAnyValidDate = submittedResponses.some((response) => {
        return response && response.createdAt && moment(response.createdAt).isValid();
    });

    // Backward compatibility: some records provide submit flags but no createdAt.
    // In that case, return submitted responses instead of incorrectly showing zero.
    if (!hasAnyValidDate) {
        return submittedResponses;
    }

    return submittedResponses.filter((response) => {
        return isInTimeRange(response.createdAt, timeRange, now);
    });
}

export function getFormStatusKey(form, now = moment()) {
    const schedule = form && (form.schedule || (form.settings && form.settings.schedule));
    if (!schedule) return 'pending';

    const hasStartAt = Boolean(schedule.startAt);
    const hasEndAt = Boolean(schedule.endAt);

    const start = hasStartAt ? moment(schedule.startAt) : null;
    const end = hasEndAt ? moment(schedule.endAt) : null;

    const startValid = start && start.isValid();
    const endValid = end && end.isValid();

    if (!startValid && !endValid) return 'pending';

    if (startValid && now.isBefore(start)) return 'pending';
    if (endValid && now.isAfter(end)) return 'closed';

    return 'open';
}

export function getTableStatusLabel(form, now = moment()) {
    const key = getFormStatusKey(form, now);
    if (key === 'open') return 'Active';
    if (key === 'closed') return 'Closed';
    return 'Pending';
}
