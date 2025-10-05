// Sistema de Boletos Escolar - JavaScript
class TicketSystem {
    constructor() {
        this.currentScreen = 'login';
        this.sessionId = null;
        this.selectedSeats = [];
        this.currentEvent = null;
        this.timer = null;
        this.timeLeft = 300; // 5 minutos
        this.queuePosition = 1;
        this.isCurrentBuyer = false;
        
        this.initializeData();
        this.initializeEventListeners();
        this.showScreen('login');
    }

    // Inicializar datos de prueba
    initializeData() {
        // Eventos de prueba
        if (!localStorage.getItem('events')) {
            const events = [
                {
                    id: 'event1',
                    name: 'Evento de Fin de Año 2024',
                    date: '2024-12-15',
                    time: '19:00',
                    price: 250
                },
                {
                    id: 'event2',
                    name: 'Evento de Fin de Curso 2024',
                    date: '2024-06-20',
                    time: '18:30',
                    price: 200
                }
            ];
            localStorage.setItem('events', JSON.stringify(events));
        }

        // Claves de acceso
        if (!localStorage.getItem('accessKeys')) {
            const keys = [
                { id: 'key1', key: 'ESCUELA2024', active: true, created: new Date().toISOString() },
                { id: 'key2', key: 'ESTUDIANTE123', active: true, created: new Date().toISOString() }
            ];
            localStorage.setItem('accessKeys', JSON.stringify(keys));
        }

        // Folios
        if (!localStorage.getItem('folios')) {
            localStorage.setItem('folios', JSON.stringify([]));
        }

        // Asientos ocupados
        if (!localStorage.getItem('occupiedSeats')) {
            localStorage.setItem('occupiedSeats', JSON.stringify({}));
        }

        // Establecer evento actual
        const events = JSON.parse(localStorage.getItem('events'));
        this.currentEvent = events[0];
    }

    // Inicializar event listeners
    initializeEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Admin button
        document.getElementById('admin-btn').addEventListener('click', () => {
            this.showScreen('admin');
        });

        // Admin login
        document.getElementById('admin-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLogin();
        });

        // Back to main
        document.getElementById('back-to-main').addEventListener('click', () => {
            this.showScreen('login');
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            document.getElementById('admin-login').style.display = 'block';
            document.getElementById('admin-panel').style.display = 'none';
        });

        // Purchase buttons
        document.getElementById('reserve-btn').addEventListener('click', () => {
            this.reserveSeats();
        });

        document.getElementById('purchase-btn').addEventListener('click', () => {
            this.confirmPurchase();
        });

        // Return button
        document.getElementById('return-btn').addEventListener('click', () => {
            this.showScreen('login');
            this.resetSystem();
        });

        // Admin tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Admin forms
        document.getElementById('event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createEvent();
        });

        document.getElementById('key-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAccessKey();
        });

        document.getElementById('search-folios').addEventListener('click', () => {
            this.searchFolios();
        });
    }

    // Mostrar pantalla
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;

            // Acciones específicas por pantalla
            if (screenName === 'store') {
                this.generateSeatMap();
                this.updateEventInfo();
                this.startTimer();
            } else if (screenName === 'admin') {
                this.loadAdminData();
            }
        }
    }

    // Manejo de login
    async handleLogin() {
        const accessKey = document.getElementById('access-key').value;
        const loginForm = document.getElementById('login-form');
        
        loginForm.classList.add('loading');

        // Simular delay
        await this.delay(1000);

        const keys = JSON.parse(localStorage.getItem('accessKeys'));
        const validKey = keys.find(k => k.key === accessKey && k.active);

        if (validKey) {
            this.sessionId = this.generateId();
            
            // Simular cola virtual
            if (Math.random() > 0.7) { // 30% probabilidad de entrar directo
                this.isCurrentBuyer = true;
                this.showToast('¡Acceso exitoso!', 'Has ingresado al sistema de boletos', 'success');
                this.showScreen('store');
            } else {
                this.queuePosition = Math.floor(Math.random() * 10) + 1;
                this.showToast('¡Acceso exitoso!', 'Has ingresado al sistema de boletos', 'success');
                this.showScreen('queue');
                this.startQueueSimulation();
            }
        } else {
            this.showToast('Error de acceso', 'Clave de acceso inválida', 'error');
        }

        loginForm.classList.remove('loading');
    }

    // Simulación de cola
    startQueueSimulation() {
        document.getElementById('queue-position').textContent = `#${this.queuePosition}`;
        document.getElementById('wait-time').textContent = `${this.queuePosition * 5} minutos aprox.`;

        // Simular avance de cola
        const queueInterval = setInterval(() => {
            this.queuePosition--;
            if (this.queuePosition <= 0) {
                clearInterval(queueInterval);
                this.showToast('¡Tu turno!', 'Ya puedes comprar tus boletos', 'success');
                this.showScreen('store');
            } else {
                document.getElementById('queue-position').textContent = `#${this.queuePosition}`;
                document.getElementById('wait-time').textContent = `${this.queuePosition * 5} minutos aprox.`;
            }
        }, 3000); // Cada 3 segundos por demo
    }

    // Generar mapa de asientos
    generateSeatMap() {
        const seatMap = document.getElementById('seat-map');
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        const seatsPerRow = 60;
        const occupiedSeats = JSON.parse(localStorage.getItem('occupiedSeats'));
        const eventOccupied = occupiedSeats[this.currentEvent.id] || [];

        seatMap.innerHTML = '';

        rows.forEach(row => {
            const seatRow = document.createElement('div');
            seatRow.className = 'seat-row';

            const rowLabel = document.createElement('div');
            rowLabel.className = 'row-label';
            rowLabel.textContent = row;
            seatRow.appendChild(rowLabel);

            const seatsContainer = document.createElement('div');
            seatsContainer.className = 'seats-container';

            for (let i = 1; i <= seatsPerRow; i++) {
                const seat = document.createElement('button');
                seat.className = 'seat available';
                seat.textContent = i;
                seat.dataset.row = row;
                seat.dataset.number = i;

                // Verificar si está ocupado
                const seatId = `${row}${i}`;
                if (eventOccupied.includes(seatId)) {
                    seat.className = 'seat occupied';
                    seat.disabled = true;
                } else {
                    // Simular algunos asientos ocupados aleatoriamente
                    if (Math.random() > 0.85) {
                        seat.className = 'seat occupied';
                        seat.disabled = true;
                    } else {
                        seat.addEventListener('click', () => {
                            this.toggleSeat(row, i, seat);
                        });
                    }
                }

                seatsContainer.appendChild(seat);
            }

            seatRow.appendChild(seatsContainer);
            seatMap.appendChild(seatRow);
        });
    }

    // Toggle seat selection
    toggleSeat(row, number, seatElement) {
        const seatId = `${row}${number}`;
        const existingIndex = this.selectedSeats.findIndex(s => s.id === seatId);

        if (existingIndex > -1) {
            // Deseleccionar
            this.selectedSeats.splice(existingIndex, 1);
            seatElement.className = 'seat available';
        } else {
            // Seleccionar
            if (this.selectedSeats.length >= 5) {
                this.showToast('Límite alcanzado', 'Máximo 5 boletos por persona', 'error');
                return;
            }

            this.selectedSeats.push({
                id: seatId,
                row: row,
                number: number
            });
            seatElement.className = 'seat selected';
        }

        this.updateSummary();
    }

    // Actualizar resumen de compra
    updateSummary() {
        const seatCount = document.getElementById('seat-count');
        const seatList = document.getElementById('seat-list');
        const totalSection = document.getElementById('total-section');
        const totalPrice = document.getElementById('total-price');

        seatCount.textContent = this.selectedSeats.length;

        if (this.selectedSeats.length === 0) {
            seatList.innerHTML = '<em>Ninguno seleccionado</em>';
            totalSection.style.display = 'none';
        } else {
            seatList.innerHTML = '';
            this.selectedSeats.forEach(seat => {
                const badge = document.createElement('span');
                badge.className = 'seat-badge';
                badge.textContent = seat.id;
                seatList.appendChild(badge);
            });

            const total = this.selectedSeats.length * this.currentEvent.price;
            totalPrice.textContent = `$${total}`;
            totalSection.style.display = 'block';
        }
    }

    // Actualizar información del evento
    updateEventInfo() {
        const eventInfo = document.getElementById('event-info');
        eventInfo.innerHTML = `
            <h3>${this.currentEvent.name}</h3>
            <p>${this.currentEvent.date} - ${this.currentEvent.time}</p>
            <div class="price">$${this.currentEvent.price} <span>por boleto</span></div>
        `;
    }

    // Iniciar timer
    startTimer() {
        this.timeLeft = 300; // 5 minutos
        this.updateTimerDisplay();

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.showToast('Tiempo agotado', 'Tu tiempo de compra ha expirado', 'error');
                setTimeout(() => {
                    this.showScreen('login');
                    this.resetSystem();
                }, 2000);
            }
        }, 1000);
    }

    // Actualizar display del timer
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timerElement = document.getElementById('timer');
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Cambiar color si queda poco tiempo
        if (this.timeLeft <= 60) {
            timerElement.style.color = '#ef4444';
            timerElement.style.animation = 'pulse 1s infinite';
        }
    }

    // Reservar asientos
    async reserveSeats() {
        if (this.selectedSeats.length === 0) {
            this.showToast('Error', 'Selecciona al menos un asiento', 'error');
            return;
        }

        const reserveBtn = document.getElementById('reserve-btn');
        reserveBtn.classList.add('loading');

        await this.delay(1000);

        this.showToast('Asientos reservados', 'Tienes 5 minutos para confirmar tu compra', 'success');
        
        reserveBtn.classList.remove('loading');
    }

    // Confirmar compra
    async confirmPurchase() {
        if (this.selectedSeats.length === 0) {
            this.showToast('Error', 'Selecciona al menos un asiento', 'error');
            return;
        }

        const purchaseBtn = document.getElementById('purchase-btn');
        purchaseBtn.classList.add('loading');

        await this.delay(2000);

        // Generar folio
        const folio = {
            id: this.generateFolioId(),
            eventId: this.currentEvent.id,
            event: this.currentEvent,
            seats: this.selectedSeats,
            totalAmount: this.selectedSeats.length * this.currentEvent.price,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 días
        };

        // Guardar folio
        const folios = JSON.parse(localStorage.getItem('folios'));
        folios.push(folio);
        localStorage.setItem('folios', JSON.stringify(folios));

        // Marcar asientos como ocupados
        const occupiedSeats = JSON.parse(localStorage.getItem('occupiedSeats'));
        if (!occupiedSeats[this.currentEvent.id]) {
            occupiedSeats[this.currentEvent.id] = [];
        }
        this.selectedSeats.forEach(seat => {
            occupiedSeats[this.currentEvent.id].push(seat.id);
        });
        localStorage.setItem('occupiedSeats', JSON.stringify(occupiedSeats));

        // Mostrar pantalla de éxito
        this.showPurchaseComplete(folio);
        
        purchaseBtn.classList.remove('loading');
        
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    // Mostrar pantalla de compra completada
    showPurchaseComplete(folio) {
        document.getElementById('folio-number').textContent = folio.id;
        
        const purchaseDetails = document.getElementById('purchase-details');
        purchaseDetails.innerHTML = `
            <div class="detail-section">
                <h3>${folio.event.name}</h3>
                <p>${folio.event.date} - ${folio.event.time}</p>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <p>Asientos:</p>
                    <p>${folio.seats.map(s => s.id).join(', ')}</p>
                </div>
                <div class="detail-item">
                    <p>Total a pagar:</p>
                    <p class="total-amount">$${folio.totalAmount}</p>
                </div>
            </div>
        `;

        this.showScreen('complete');
    }

    // Admin login
    async handleAdminLogin() {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        if (username === 'admin' && password === 'admin123') {
            this.showToast('Login exitoso', 'Bienvenido al panel administrativo', 'success');
            document.getElementById('admin-login').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            this.loadAdminData();
        } else {
            this.showToast('Error de login', 'Credenciales inválidas', 'error');
        }
    }

    // Cargar datos del admin
    loadAdminData() {
        this.loadEvents();
        this.loadAccessKeys();
        this.loadFolios();
    }

    // Cambiar tab del admin
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    // Crear evento
    async createEvent() {
        const name = document.getElementById('event-name').value;
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        const price = parseFloat(document.getElementById('event-price').value);

        const event = {
            id: this.generateId(),
            name,
            date,
            time,
            price
        };

        const events = JSON.parse(localStorage.getItem('events'));
        events.push(event);
        localStorage.setItem('events', JSON.stringify(events));

        this.showToast('Evento creado', 'El evento ha sido creado exitosamente', 'success');
        document.getElementById('event-form').reset();
        this.loadEvents();
    }

    // Crear clave de acceso
    async createAccessKey() {
        const key = document.getElementById('new-key').value;

        const accessKey = {
            id: this.generateId(),
            key,
            active: true,
            created: new Date().toISOString()
        };

        const keys = JSON.parse(localStorage.getItem('accessKeys'));
        keys.push(accessKey);
        localStorage.setItem('accessKeys', JSON.stringify(keys));

        this.showToast('Clave creada', 'La clave de acceso ha sido creada', 'success');
        document.getElementById('key-form').reset();
        this.loadAccessKeys();
    }

    // Cargar eventos
    loadEvents() {
        const events = JSON.parse(localStorage.getItem('events'));
        const eventsList = document.getElementById('events-list');

        eventsList.innerHTML = '';
        events.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'item-card';
            eventCard.innerHTML = `
                <div class="item-header">
                    <div class="item-info">
                        <h4>${event.name}</h4>
                        <p>${event.date} - ${event.time}</p>
                        <p class="price">$${event.price} por boleto</p>
                    </div>
                    <div class="item-actions">
                        <button class="btn-small btn-danger" onclick="ticketSystem.deleteEvent('${event.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            eventsList.appendChild(eventCard);
        });
    }

    // Cargar claves de acceso
    loadAccessKeys() {
        const keys = JSON.parse(localStorage.getItem('accessKeys'));
        const keysList = document.getElementById('keys-list');

        keysList.innerHTML = '';
        keys.forEach(key => {
            const keyCard = document.createElement('div');
            keyCard.className = 'item-card';
            keyCard.innerHTML = `
                <div class="item-header">
                    <div class="item-info">
                        <h4>${key.key}</h4>
                        <p>Creada: ${new Date(key.created).toLocaleDateString()}</p>
                    </div>
                    <div class="item-actions">
                        <span class="status-badge ${key.active ? 'status-active' : 'status-pending'}">
                            ${key.active ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                </div>
            `;
            keysList.appendChild(keyCard);
        });
    }

    // Cargar folios
    loadFolios() {
        const folios = JSON.parse(localStorage.getItem('folios'));
        const foliosList = document.getElementById('folios-list');

        foliosList.innerHTML = '';
        folios.forEach(folio => {
            const folioCard = document.createElement('div');
            folioCard.className = 'item-card';
            folioCard.innerHTML = `
                <div class="item-header">
                    <div class="item-info">
                        <h4>${folio.id}</h4>
                        <p>${folio.event.name}</p>
                        <p>Asientos: ${folio.seats.map(s => s.id).join(', ')}</p>
                        <p><strong>$${folio.totalAmount}</strong></p>
                        <p>Expira: ${new Date(folio.expiresAt).toLocaleDateString()}</p>
                    </div>
                    <div class="item-actions">
                        <span class="status-badge status-${folio.status}">
                            ${folio.status === 'pending' ? 'Pendiente' : 
                              folio.status === 'paid' ? 'Pagado' : 'Expirado'}
                        </span>
                        ${folio.status === 'pending' ? `
                            <button class="btn-small btn-success" onclick="ticketSystem.markFolioPaid('${folio.id}')">
                                Marcar Pagado
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            foliosList.appendChild(folioCard);
        });
    }

    // Buscar folios
    searchFolios() {
        const searchTerm = document.getElementById('folio-search').value.toLowerCase();
        const folios = JSON.parse(localStorage.getItem('folios'));
        
        let filteredFolios = folios;
        if (searchTerm) {
            filteredFolios = folios.filter(folio => 
                folio.id.toLowerCase().includes(searchTerm)
            );
        }

        const foliosList = document.getElementById('folios-list');
        foliosList.innerHTML = '';
        
        filteredFolios.forEach(folio => {
            const folioCard = document.createElement('div');
            folioCard.className = 'item-card';
            folioCard.innerHTML = `
                <div class="item-header">
                    <div class="item-info">
                        <h4>${folio.id}</h4>
                        <p>${folio.event.name}</p>
                        <p>Asientos: ${folio.seats.map(s => s.id).join(', ')}</p>
                        <p><strong>$${folio.totalAmount}</strong></p>
                        <p>Expira: ${new Date(folio.expiresAt).toLocaleDateString()}</p>
                    </div>
                    <div class="item-actions">
                        <span class="status-badge status-${folio.status}">
                            ${folio.status === 'pending' ? 'Pendiente' : 
                              folio.status === 'paid' ? 'Pagado' : 'Expirado'}
                        </span>
                        ${folio.status === 'pending' ? `
                            <button class="btn-small btn-success" onclick="ticketSystem.markFolioPaid('${folio.id}')">
                                Marcar Pagado
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            foliosList.appendChild(folioCard);
        });
    }

    // Marcar folio como pagado
    markFolioPaid(folioId) {
        const folios = JSON.parse(localStorage.getItem('folios'));
        const folio = folios.find(f => f.id === folioId);
        
        if (folio) {
            folio.status = 'paid';
            localStorage.setItem('folios', JSON.stringify(folios));
            this.showToast('Estado actualizado', 'Folio marcado como pagado', 'success');
            this.loadFolios();
        }
    }

    // Eliminar evento
    deleteEvent(eventId) {
        if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
            const events = JSON.parse(localStorage.getItem('events'));
            const filteredEvents = events.filter(e => e.id !== eventId);
            localStorage.setItem('events', JSON.stringify(filteredEvents));
            
            this.showToast('Evento eliminado', 'El evento ha sido eliminado exitosamente', 'success');
            this.loadEvents();
        }
    }

    // Mostrar toast notification
    showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-header">
                <div class="toast-title">${title}</div>
                <button class="toast-close">&times;</button>
            </div>
            <div class="toast-message">${message}</div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }

    // Utilities
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    generateFolioId() {
        return 'FOL' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 3).toUpperCase();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    resetSystem() {
        this.sessionId = null;
        this.selectedSeats = [];
        this.timeLeft = 300;
        this.queuePosition = 1;
        this.isCurrentBuyer = false;
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        document.getElementById('access-key').value = '';
        document.getElementById('admin-username').value = '';
        document.getElementById('admin-password').value = '';
    }
}

// Inicializar sistema cuando se carga la página
let ticketSystem;
document.addEventListener('DOMContentLoaded', () => {
    ticketSystem = new TicketSystem();
});