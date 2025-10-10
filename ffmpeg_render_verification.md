# Verificação da Instalação do FFmpeg na Implantação do Render

Este documento fornece instruções para verificar a correta instalação e disponibilidade do FFmpeg no ambiente de implantação do Render, essencial para o funcionamento do serviço de conversão de vídeo H.265.

## 1. Acessar o Shell do Serviço no Render

Para verificar a instalação do FFmpeg, é necessário acessar o shell do seu serviço no Render. Siga os passos abaixo:

1.  **Navegue até o Dashboard do Render:** Faça login na sua conta do Render e selecione o serviço onde o backend do Color Studio está implantado.
2.  **Abra o Shell:** No painel do serviço, procure pela opção "Shell" ou "Console" e clique nela. Isso abrirá um terminal interativo diretamente no ambiente de execução do seu serviço.

## 2. Verificar a Versão do FFmpeg

Uma vez no shell do serviço, execute o seguinte comando para verificar se o FFmpeg está instalado e qual a sua versão:

```bash
ffmpeg -version
```

**Resultado Esperado:**

Se o FFmpeg estiver corretamente instalado, você deverá ver uma saída similar a esta (a versão pode variar):

```
ffmpeg version 4.4.2-0ubuntu0.22.04.1 Copyright (c) 2000-2021 the FFmpeg developers
  built with gcc 11 (Ubuntu 11.2.0-19ubuntu1)
  configuration: --prefix=/usr --extra-version=0ubuntu0.22.04.1 --toolchain=hardened --libdir=/usr/lib/x86_64-linux-gnu --incdir=/usr/include/x86_64-linux-gnu --arch=amd64 --enable-gpl --disable-stripping --enable-gnutls --enable-ladspa --enable-libaom --enable-libass --enable-libbluray --enable-libbs2b --enable-libcaca --enable-libcdio --enable-libcodec2 --enable-libdav1d --enable-libflite --enable-libfontconfig --enable-libfreetype --enable-libfribidi --enable-libgme --enable-libgsm --enable-libjack --enable-libmp3lame --enable-libmysofa --enable-libopenjpeg --enable-libopenmpt --enable-libopus --enable-libpulse --enable-librabbitmq --enable-librubberband --enable-libshine --enable-libsnappy --enable-libsoxr --enable-libspeex --enable-libsrt --enable-libssh --enable-libtheora --enable-libtwolame --enable-libvidstab --enable-libvorbis --enable-libvpx --enable-libwebp --enable-libx265 --enable-libxml2 --enable-libxvid --enable-libzimg --enable-libzmq --enable-libzvbi --enable-lv2 --enable-omx --enable-openal --enable-opencl --enable-opengl --enable-sdl2 --enable-pocketsphinx --enable-librsvg --enable-libmfx --enable-libdc1394 --enable-libdrm --enable-libiec61883 --enable-chromaprint --enable-frei0r --enable-libx264 --enable-shared
  libavutil      56. 70.100 / 56. 70.100
  libavcodec     58.134.100 / 58.134.100
  libavformat    58. 76.100 / 58. 76.100
  libavdevice    58. 13.100 / 58. 13.100
  libavfilter     7.110.100 /  7.110.100
  libswscale      5.  9.100 /  5.  9.100
  libswresample   3.  9.100 /  3.  9.100
  libpostproc    55.  9.100 / 55.  9.100
```

Se você receber um erro como `ffmpeg: command not found` ou uma saída diferente que indique que o FFmpeg não está disponível, será necessário instalá-lo ou garantir que o caminho para o executável esteja configurado corretamente no ambiente do Render.

## 3. Verificar Suporte a `libx265`

Para a conversão H.265, é crucial que o FFmpeg tenha sido compilado com suporte à biblioteca `libx265`. Você pode verificar isso na saída do comando `ffmpeg -version` procurando por `--enable-libx265` na linha `configuration`.

Se `--enable-libx265` não estiver presente, o FFmpeg instalado não suporta a codificação H.265 e precisará ser atualizado ou reinstalado com o suporte adequado.

## 4. Próximos Passos

Após verificar a instalação do FFmpeg, você pode prosseguir com os testes de conversão no ambiente de produção do Render. Caso encontre problemas, consulte a documentação do Render sobre como instalar pacotes adicionais ou configurar o ambiente de execução.
