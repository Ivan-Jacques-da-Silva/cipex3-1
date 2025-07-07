import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './calendar.css'

function AgendaLayout() {
    const [events, setEvents] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '' });

    const handleDateClick = (info) => {
        setNewEvent({ ...newEvent, date: info.dateStr });
        setModalOpen(true);
    };

    const handleEventClick = (info) => {
        if (window.confirm(`Deseja excluir o evento '${info.event.title}'?`)) {
            info.event.remove();
            setEvents(events.filter(event => event.title !== info.event.title));
        }
    };

    const handleAddEvent = () => {
        if (newEvent.title && newEvent.date) {
            setEvents([...events, { title: newEvent.title, start: newEvent.date, description: newEvent.description }]);
            setNewEvent({ title: '', description: '', date: '' });
            setModalOpen(false);
        } else {
            alert('Por favor, preencha todos os campos.');
        }
    };

    return (
        <div className="agenda-container container-fluid p-3">
            <div className="row">
                {/* Card da Esquerda */}
                <div className="col-md-4 col-12 mb-3">
                    <div className="card h-100 p-3">
                        <span className="card-title">Eventos do Dia</span>
                        <div className="event-list mt-3">
                            {events.map((event, index) => (
                                <div key={index} className="event-item mb-2">
                                    <p><strong>{event.title}</strong></p>
                                    <p>{event.date}</p>
                                    <p>{event.description}</p>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-primary mt-3" onClick={() => setModalOpen(true)}>Cadastrar Evento</button>
                        <span>Em desenvolvimento</span>
                    </div>
                </div>

                {/* Card da Direita */}
                <div className="col-md-8 col-12">
                    <div className="card h-100 p-3">
                        <span className="card-title">Calendário</span>
                        <div className="calendar-wrapper mt-3">
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                events={events}
                                dateClick={handleDateClick}
                                eventClick={handleEventClick}
                                locale="pt-br"
                                headerToolbar={{
                                    left: 'prev,next',
                                    center: 'title',
                                    right: window.innerWidth <= 768 ? 'dayGridMonth,dayGridWeek,dayGridDay' : 'dayGridMonth,dayGridWeek,dayGridDay',
                                }}
                                buttonText={{
                                    today: 'Hoje',
                                    month: 'Mês',
                                    week: 'Semana',
                                    day: 'Dia',
                                }}
                                editable={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Cadastro de Evento */}
            {modalOpen && (
                <div className="modal fade show d-block" tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Cadastrar Evento</h5>
                                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Título</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Descrição</label>
                                    <textarea
                                        className="form-control"
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Data</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button type="button" className="btn btn-primary" onClick={handleAddEvent}>Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AgendaLayout;