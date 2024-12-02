document.addEventListener('DOMContentLoaded', () => {
    const spectrumContainer = document.getElementById('audio-spectrum');
    const statusElement = document.getElementById('status');
    const controlButton = document.createElement('button');
    controlButton.id = 'audio-capture-button';
    controlButton.textContent = 'Capturar Áudio do Sistema';
    controlButton.className = 'btn btn-primary';

    // Inserir o botão logo após a div de status
    statusElement.insertAdjacentElement('afterend', controlButton);

    let audioContext = null;
    let analyser = null;
    let source = null;
    let stream = null;
    let animationFrameId = null;

    // Frequências desejadas (em Hz)
    const targetFrequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

    // Criar barras para cada frequência específica
    function createSpectrumBars() {
        spectrumContainer.innerHTML = ''; // Limpar container anterior
        targetFrequencies.forEach(freq => {
            const barLabel = document.createElement('div');
            barLabel.className = 'spectrum-barLabel';
            barLabel.textContent = `${freq}Hz`;
            spectrumContainer.appendChild(barLabel);

            const bar = document.createElement('div');
            bar.className = 'spectrum-bar';
            bar.setAttribute('data-frequency', `${freq}Hz`);
            barLabel.appendChild(bar);
        });
    }

    function stopCapture() {
        // Parar animação
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // Fechar stream de mídia
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        // Fechar contexto de áudio
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }

        // Limpar barras
        spectrumContainer.innerHTML = '';
        statusElement.textContent = 'Captura de som encerrada, Clique em "Capturar Áudio do Sistema" para começar';

        // Resetar botão
        controlButton.textContent = 'Capturar Áudio do Sistema';
        controlButton.classList.remove('btn-danger');
        controlButton.classList.add('btn-primary');
    }

    async function startCapture() {
        try {
            // Solicitar stream de display (com áudio)
            stream = await navigator.mediaDevices.getDisplayMedia({ audio: true });

            // Configurar contexto de áudio
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            analyser.fftSize = 2048;
            const sampleRate = audioContext.sampleRate;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // Calcular índices de frequência
            const frequencyIndexes = targetFrequencies.map(freq =>
                Math.round(freq / (sampleRate / 2) * bufferLength)
            );

            // Criar barras de espectro
            createSpectrumBars();
            const bars = document.getElementsByClassName('spectrum-bar');

            statusElement.textContent = 'Capturando som...';
            controlButton.textContent = 'Encerrar Captura';
            controlButton.classList.remove('btn-primary');
            controlButton.classList.add('btn-danger');

            function updateSpectrum() {
                analyser.getByteFrequencyData(dataArray);

                // Atualizar cada barra com base nas frequências específicas
                frequencyIndexes.forEach((index, i) => {
                    const barHeight = dataArray[index];
                    const bar = bars[i];

                    // Ajustar altura e cor da barra
                    bar.style.height = `${barHeight}px`;

                    // // Criar gradiente baseado nos níveis de decibéis
                    // let gradient = 'green'; // Começa com verde para níveis muito baixos
                    // if (barHeight >= 64) gradient += `, yellow ${barHeight * 0.25}%`; // Baixos-médios
                    // if (barHeight >= 128) gradient += `, orange ${barHeight * 0.5}%`; // Médios-altos
                    // if (barHeight >= 192) gradient += `, red ${barHeight * 0.75}%`; // Altos-muito altos

                    // bar.style.background = `linear-gradient(to top, ${gradient})`;

                    if (barHeight < 64) {
                        bar.style.backgroundColor = 'green';
                    } else if (barHeight < 128) {
                        bar.style.backgroundColor = 'yellow';
                    } else if (barHeight < 192) {
                        bar.style.backgroundColor = 'orange';
                    } else {
                        bar.style.backgroundColor = 'red';
                    }
                });

                animationFrameId = requestAnimationFrame(updateSpectrum);
            }

            updateSpectrum();

        } catch (err) {
            statusElement.textContent = `Erro ao capturar áudio: ${err.message}`;
            stopCapture();
        }
    }

    // Configurar evento de clique do botão
    controlButton.addEventListener('click', () => {
        if (stream) {
            // Se já estiver capturando, parar
            stopCapture();
        } else {
            // Se não estiver capturando, iniciar
            startCapture();
        }
    });
});

const ano = document.getElementById('ano')
ano.textContent = new Date().getFullYear()
