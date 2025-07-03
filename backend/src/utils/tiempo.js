function esHoraPico(horaActualISO, horariosPico) {
    const hora = horaActualISO.slice(11, 16); // Extrae "HH:mm"
    return horariosPico.some(({ inicio, fin }) => hora >= inicio && hora <= fin);
}

function obtenerNombreDia(fecha) {
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return dias[fecha.getUTCDay()];
}

function determinarTipoDia(fecha, feriados = []) {
    const diaSemana = fecha.getUTCDay(); // 0 = Domingo, 6 = Sábado
    const esFeriado = feriados.includes(fecha.toISOString().split('T')[0]);

    if (esFeriado) return 'feriado';
    if (diaSemana === 0 || diaSemana === 6) return 'fin_de_semana';
    return 'laboral';
}

module.exports = {
    esHoraPico,
    obtenerNombreDia,
    determinarTipoDia
};
