$(() => {
    rebuildPage()
});

const rebuildPage = () => {
    setDate();
    buildOptions().then((code) => {
        const [start, end] = getWeekAsInterval();
        Route.schedule.staff.between.get(code, start, end).then((data) => {
            buildTable(data, start);
        });
    });
};

const setDate = () => {
    const week = `${moment().year()}-W${moment().week()}`;
    $('#date-picker').val(week);
};

const buildOptions = async () => new Promise((resolve, reject) => {
    Route.schedule.staff.options.get().then((data) => {
        const fst_code = data[0][0];
        resolve(fst_code);
        const options = data.map(([code, fname, lname]) => `<option value="${code}" title="${code}">${fname} ${lname}</option>`);
        $('#entity-picker').append(options);
        setCode(fst_code);
    }).catch((e) => reject(e))
});

const getWeekAsInterval = () => {
    const weekVal = $('#date-picker').val();
    const mo = moment(weekVal);
    const start = mo.format('yyyy-MM-DD');
    const end = mo.endOf('isoWeek').format('yyyy-MM-DD');
    return [start, end];
};

const buildTable = (data, start) => {
    const days = Array.from({length: 7}, (_, i) => {
        const mo = moment(start).add(i, 'days').locale('fr');
        return mo.format('yyyy-MM-DD');
    });
    const schedule = Object.fromEntries(days.map((day) => [day, {}]));
    let min = 9, max = 16;
    data.forEach(([datetime, parcel, sector]) => {
        const [date, time] = datetime.split(' ');
        const hour = Number(time.split(':')[0]);
        min = Math.min(min, hour);
        max = Math.max(max, hour);
        schedule[date][hour] = [parcel, sector];
    });
    const hours = Array.from({length: max + 1 - min}, (_, i) => i + min);
    const rows = hours.map((hour) => {
        const rowHeader = `<th scope="row">${hour.toString().padStart(2, '0')}:00</th>`;
        const cells = days.map((date) => `<td>${buildParcel(schedule[date][hour])}</td>`)
        return `<tr>${rowHeader}${cells}</tr>`
    });
    const head = `<tr><th>Début</th>${
        days.map((date) => `<th>${date}</th>`)
    }</tr>`;
    $('thead').empty().append(head);
    $('tbody').empty().append(rows);
};

const buildParcel = (parcel) => {
    if (!parcel || parcel.length !== 2) {
        return '<kbd class="secondary">N/A</kbd><i class="muted">Aucun</i>'
    }
    const [parcelNum, sector] = parcel
    return `<kbd>${parcelNum.toString().padStart(3, '0')}</kbd>${sector}`
}

const reloadRows = () => {
    const code = $('#entity-picker').val();
    const [start, end] = getWeekAsInterval();
    Route.schedule.staff.between.get(code, start, end).then((data) => {
        buildTable(data, start);
    }).catch(({status}) => {
        if (status === 404) rebuildPage();
    });
};

const onEntityChange = () => {
    setCode($('#entity-picker').val());
    reloadRows();
};

const setCode = (code) => {
    const el = $('#code-hint');
    if (!code) {
        el.addClass('secondary').text('N/A');
    } else {
        el.removeClass('secondary').text(code);
    }
};
