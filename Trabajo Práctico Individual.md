
Durante los últimos años, la industria del entretenimiento en vivo creció de forma sostenida: recitales, obras de teatro, festivales, conferencias y eventos deportivos convocan cada vez a más público. Cada vez más personas buscan **descubrir eventos** de su interés y **adquirir entradas** de forma rápida y segura desde su teléfono, sin necesidad de hacer filas en boleterías. En paralelo, miles de productores independientes, salas y organizadores eligen **publicar sus propios eventos** y gestionar la venta de entradas de manera autónoma.

En este contexto, surge la necesidad de plataformas que permitan **conectar** de manera simple y segura a quienes organizan eventos con quienes desean asistir. Los organizadores requieren herramientas que les permitan **publicar** sus **eventos**, definir los distintos **tipos de entrada** disponibles (por ejemplo, General, Platea o VIP), establecer precios y cupos, y **administrar** las **ventas realizadas**. Por su parte, los compradores buscan soluciones que les permitan **explorar eventos** por categoría, buscar espectáculos específicos mediante una barra de búsqueda y comprar sus entradas de manera rápida y confiable.

Como respuesta a esta necesidad, una organización ha solicitado el desarrollo de **AI Ticket It**, una plataforma orientada a la publicación de eventos y la venta de entradas. Dentro del sistema, los organizadores podrán crear y gestionar sus eventos, incluyendo descripciones detalladas, fecha de realización, material multimedia y distintos tipos de entrada según ubicación, precio y cupo disponible. Los compradores, a su vez, podrán navegar el catálogo de eventos, filtrar por categorías, guardar eventos favoritos y comprar las entradas que mejor se adapten a sus necesidades.

Una vez realizada una compra, el sistema permitirá realizar un **seguimiento** de la **compra** hasta el día del evento. Las compras atravesarán distintas **etapas** que reflejan su situación (pendiente de pago, confirmada, utilizada, cancelada o reembolsada), permitiendo tanto al comprador como al organizador conocer el estado actual y realizar las acciones correspondientes en cada momento. Además, cada compra contará con un espacio de comunicación simple donde ambas partes podrán **intercambiar mensajes** para realizar consultas sobre el evento, el acceso al lugar o eventuales cambios de fecha.

Una vez finalizado el evento, los asistentes podrán **calificar** su experiencia mediante un puntaje y un comentario, permitiendo que futuros compradores conozcan la reputación de cada organizador. Para acompañar este flujo, la plataforma buscará brindar una experiencia clara, ordenada y transparente, facilitando la organización de los eventos y reduciendo la dependencia de canales externos de comunicación y venta.

Para llevar adelante este objetivo, se diseñará e implementará **AI Ticket It** como una solución web moderna y escalable. El desarrollo se organizará en distintas iteraciones, permitiendo construir progresivamente las funcionalidades principales del sistema, comenzando desde el modelo conceptual del negocio hasta la implementación completa de la plataforma.


## **Casos de Uso** {#casos-de-uso}

Se espera el desarrollo de las siguientes funcionalidades:

* Como comprador, quiero poder visualizar mis compras, diferenciando con claridad el estado en el que se encuentran y cuántos días faltan para el evento en caso de estar en estado confirmada.  
* Como organizador, quiero poder visualizar las compras asociadas a un Evento en particular, diferenciando con claridad el estado en el que se encuentran y cuántas entradas quedan disponibles de cada tipo.  
* Como comprador, quiero poder buscar Eventos de forma específica mediante una búsqueda textual o explorarlos por categorías.  
* Como organizador, quiero poder crear un Evento ofreciendo distintos tipos de entrada, cada uno con su precio y cupo, permitiendo adaptarse a diferentes públicos y presupuestos.  
* Como comprador, quiero poder enviar mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma.  
* Como organizador, quiero poder responder mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma.  
* Como comprador, quiero poder cancelar una compra para obtener el reembolso en caso de no poder asistir al evento.  
* Como organizador, quiero que los compradores puedan cancelar una compra siempre que la misma no se encuentre en estado **utilizada** y el evento aún no se haya realizado.  
* Como organizador, quiero que una vez utilizada una entrada el comprador pueda puntuar el Evento de forma numérica y dejar un comentario escrito.  
* Como comprador, quiero que las reseñas de eventos anteriores se visualicen en los Eventos de cada organizador para conocer experiencias previas antes de comprar.  
* Como comprador, al buscar Eventos, quiero poder ordenarlos por precio, fecha del evento y puntaje del organizador.  
* Como comprador, quiero poder realizar una compra sobre un Evento seleccionando uno de los tipos de entrada disponibles y la cantidad deseada, sin superar el cupo disponible.

## 



