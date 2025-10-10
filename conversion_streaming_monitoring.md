# Monitoramento da Funcionalidade de Conversão e Streaming

Este documento detalha os passos para monitorar a funcionalidade de conversão de vídeo H.265 e o streaming via Cloudflare Stream, garantindo que o fluxo de trabalho do Color Studio esteja operando conforme o esperado.

## 1. Monitoramento dos Logs do Backend

Os logs do backend são a primeira linha de defesa para identificar problemas na conversão. Eles fornecerão informações detalhadas sobre o processo de download, conversão FFmpeg e upload para o Cloudflare Stream.

### Como Acessar os Logs:

1.  **No Render:** Acesse o dashboard do seu serviço de backend no Render. Navegue até a seção "Logs" para visualizar a saída em tempo real do seu aplicativo. Procure por mensagens relacionadas a `R2 Service`, `FFmpeg` e `ConversionService`.
2.  **Localmente (durante o desenvolvimento):** Se estiver executando o backend localmente, os logs serão exibidos diretamente no terminal onde o servidor Flask foi iniciado.

### O que Procurar nos Logs:

*   **Mensagens de Sucesso:**
    *   `✅ R2 Service initialized:`: Confirma que o serviço R2 foi inicializado.
    *   `🧪 [TEST MODE] Gerando URL presigned simulada para...`: Se estiver em modo de teste, indica que a URL de download foi simulada.
    *   `🧪 [TEST MODE] Simulando download de...`: Se estiver em modo de teste, indica que o download do arquivo original foi simulado.
    *   `🧪 [TEST MODE] Simulando conversão FFmpeg para...`: Se estiver em modo de teste, indica que a conversão FFmpeg foi simulada.
    *   `✅ Upload completo:`: Confirma que o arquivo foi enviado para o R2 (para uploads RAW).
    *   `✅ Presigned URL gerada:`: Confirma que uma URL presigned para download foi gerada.
    *   `Conversion completed for MediaFile ID: [ID]`: Indica que a conversão H.265 foi concluída com sucesso.
*   **Mensagens de Erro:**
    *   `❌ Erro ao criar multipart upload:`
    *   `❌ Erro ao gerar presigned URL:`
    *   `FFmpeg/Wget error:`: Erros durante o download ou execução do FFmpeg.
    *   `Conversion failed:`: Erros gerais na lógica de conversão.
    *   `MediaFile not found`: Indica que o `media_file_id` fornecido não corresponde a nenhum registro no banco de dados.
    *   `UnboundLocalError`: Erros de variáveis não inicializadas (já corrigidos, mas bom estar ciente).

## 2. Verificação no Cloudflare Stream Dashboard

Após a conversão, o vídeo H.265 é supostamente enviado para o Cloudflare Stream. Você pode verificar o status e a disponibilidade do vídeo diretamente no dashboard do Cloudflare.

### Como Acessar:

1.  **Faça login no Cloudflare:** Acesse sua conta do Cloudflare.
2.  **Navegue até Stream:** No menu lateral, selecione a opção "Stream".
3.  **Verifique os Vídeos:** Procure pelo vídeo recém-convertido. Ele deve aparecer com um `stream_uid` que corresponde ao gerado pelo backend (ex: `h265_[conversion_id]`).

### O que Procurar:

*   **Status do Vídeo:** O vídeo deve ter o status "Ready" ou similar, indicando que foi processado e está pronto para streaming.
*   **URL de Streaming:** Verifique se a URL de streaming gerada pelo backend (`stream_url`) corresponde à URL fornecida pelo Cloudflare Stream para o vídeo.
*   **Reprodução:** Tente reproduzir o vídeo diretamente do dashboard do Cloudflare Stream para confirmar que o streaming está funcionando.

## 3. Teste na Aplicação Frontend

Finalmente, o teste mais importante é verificar se o vídeo convertido pode ser reproduzido na aplicação frontend do Color Studio.

### Como Testar:

1.  **Acesse a `UploadPage`:** Navegue até a página de upload ou uma página de visualização de projetos no seu aplicativo Color Studio.
2.  **Inicie a Conversão:** Se a conversão ainda não tiver sido iniciada, use a interface para acioná-la.
3.  **Verifique o Status:** A interface deve exibir o status da conversão (pendente, em progresso, concluída).
4.  **Reproduza o Vídeo:** Uma vez que a conversão esteja concluída, deve haver uma opção para visualizar ou reproduzir o vídeo H.265. Clique nela para confirmar a reprodução.

### O que Procurar:

*   **Atualização do Status:** O status da conversão deve ser atualizado dinamicamente na interface do usuário.
*   **Reprodução Suave:** O vídeo deve ser reproduzido sem interrupções, com boa qualidade de imagem e áudio.
*   **Controles do Player:** Verifique se os controles do player (play, pause, seek, volume) funcionam corretamente.

Ao seguir estes passos, você poderá monitorar e garantir a correta funcionalidade do sistema de conversão e streaming de vídeo H.265 no Color Studio.
