 

document.addEventListener('DOMContentLoaded', async function () {

    

    const signInButton = document.querySelector('.g_id_signin');
    signInButton.addEventListener('click', function() {
      gapi.auth2.getAuthInstance().signIn().then(onSignIn);
    });



    var containerEl = document.getElementById('external-events-list');
    new FullCalendar.Draggable(containerEl, {
        itemSelector: '.fc-event',
        eventData: function (eventEl) {
            return {
                title: eventEl.innerText.trim()
            }
        }
    });

    var tooltip = document.getElementById('tooltip');  // Referência à tooltip
    const descricaoPadrao = "Descrição do evento!";

    /* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */

    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {

        initialView: 'timeGridWeek',
        selectable: true,
        themeSystem: 'bootstrap5',
        timeZone: 'local',
        locale: 'pt-br',
        nowIndicator: true,

        eventMouseEnter: function (info) {
            // Calcula a posição do evento na tela
            var eventRect = info.el.getBoundingClientRect();

            // Atualiza a posição do tooltip para ficar sobre o evento
            tooltip.style.top = eventRect.top + window.scrollY - tooltip.offsetHeight - 5 + 'px'; // Ajusta verticalmente
            tooltip.style.left = eventRect.left + window.scrollX + 'px'; // Ajusta horizontalmente

            tooltip.innerText = `${info.event.title}: ${descricaoPadrao}`; // Define o conteúdo da tooltip
            tooltip.style.display = 'block'; // Exibe a tooltip
        },

        eventMouseLeave: async function (info) {
           

            tooltip.style.display = 'none';  // Oculta a tooltip
            
        },
        
        eventDidMount: async function (info) {
            info.event.setProp('url', await  criarReuniaoMeet());
        },

        eventClick: async function (info) {
            const isTrusted = info.jsEvent.isTrusted
            info.jsEvent.preventDefault(); // Impede a navegação imediata
            const profile = googleUser.getBasicProfile();
            const confirmacao = confirm('Deseja abrir a sala do Meet para este evento?');
            if (confirmacao && isTrusted ) {

                await createMeeting().then(meetLink => {
                        window.open(meetLink, '_blank'); // Abre o link em uma nova aba
                    }).catch(error => {
                        console.error('Erro ao criar a reunião:', error);
                    });


                // await criarReuniaoMeet().then(meetLink => {
                //     window.open(meetLink, '_blank'); // Abre o link em uma nova aba
                // }).catch(error => {
                //     console.error('Erro ao criar a reunião:', error);
                // });
            }
          
        },

        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5],

            startTime: '08:00',
            endTime: '18:00',
        },

        navLinks: true, // can click day/week names to navigate views

        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        editable: true,
        droppable: true,
        drop: function (arg) {

            if (document.getElementById('drop-remove').checked) {
                arg.draggedEl.parentNode.removeChild(arg.draggedEl);
            }

        }
    });
    calendar.render();

    let token = null;

    function handleCredentialResponse(response) {
        token = response.credential; // Salva o token JWT
    }

    async function authenticate() {
        const authInstance = await gapi.auth2.getAuthInstance();
        if (!authInstance) {
            throw new Error('Instância de autenticação não encontrada');
        }
        await authInstance.signIn();
    }


    window.onload = ()=> {
        let gapiLoaded = false;

        gapi.load('client:auth2', function() {
          gapi.auth2.init({
            client_id: '570807146523-1l9gfnc8umc3b2m1knbraqp96f17siq6.apps.googleusercontent.com'
          }).then(() => {
            gapiLoaded = true;
          });
        });
      }

     

    // Renderiza o botão de login no elemento HTML com ID "buttonDiv"
    window.onload = function () {
     
        gapi.load('client:auth2', function() {
            gapi.auth2.init({
              client_id: '570807146523-1l9gfnc8umc3b2m1knbraqp96f17siq6.apps.googleusercontent.com'
            }).then(() => {
              gapiLoaded = true;
            });
          });
    
          function onSignIn(googleUser) {
            const profile = googleUser.getBasicProfile();
            console.log('Logado como: ' + profile.getName());
            
           
            createMeeting(profile);
          }




 

        google.accounts.id.renderButton(
            document.getElementById('buttonDiv'), // Elemento onde o botão vai ser renderizado
            { theme: 'outline', size: 'large' }  // Personalização do botão
        );

        document.getElementById('loginButton').addEventListener('click', () => {
            client.requestAccessToken(); // Solicita o token
        });

        google.accounts.id.renderButton(
            document.getElementById('buttonDiv'),
            { theme: 'outline', size: 'large' })

        google.accounts.id.prompt(); // Exibe o prompt de login automaticamente
    };


    async function createMeeting(profile) {
        if (!gapiLoaded) {
          console.error('Google API ainda não está carregada.');
          return;
        }

        try {
          await gapi.auth2.getAuthInstance().signIn();
          await gapi.client.load('calendar', 'v3');

          const event = {
            'summary': 'Reunião de Exemplo',
            'location': 'Online',
            'description': 'Discussão sobre projeto.',
            'start': {
              'dateTime': '2024-10-30T10:00:00-03:00', // Data e hora de início
              'timeZone': 'America/Sao_Paulo',
            },
            'end': {
              'dateTime': '2024-10-30T11:00:00-03:00', // Data e hora de término
              'timeZone': 'America/Sao_Paulo',
            },
            'attendees': [
              {'email': profile.getEmail()},
            ],
          };

          const request = gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event,
          });

          const response = await request.execute();
          console.log('Reunião criada: ' + response.htmlLink);
        } catch (error) {
          console.error('Erro ao criar reunião: ', error);
        }
      }

    async function criarReuniaoMeet() {
        await authenticate();
        const evento = {
            summary: 'Reunião do Evento',
            start: { dateTime: new Date().toISOString() },
            end: { dateTime: new Date(Date.now() + 30 * 60000).toISOString() },
            conferenceData: {
                createRequest: {
                    requestId: `req-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

       
        if (token) {
        try {                            
                const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`, // Usa o token obtido via GIS
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(evento),

                });

                const data = await response.json();
                console.log('Link do Meet:', data.hangoutLink);
                return data.hangoutLink;
            } catch (error) {
                console.error('Erro ao criar a reunião:', error);
            }
        }

    }


});

 