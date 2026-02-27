// Company Tours — static site JS router
// Replicates the PHP + XML rendering from the original site.

var LANGS = ['espanol', 'english', 'francais', 'portuguese', 'italiano', 'deutsch'];
var DEFAULT_LANG = 'espanol';
var DEFAULT_DATA = 'idx';

var PRIVACY_LABELS = {
  espanol:    'Principios de Privacidad y Confidencialidad de la Información',
  english:    'Principles of Privacy and Confidentiality of Information',
  francais:   "Les principes de la vie privée et de la confidentialité de l'information sont respectés",
  portuguese: 'Princípios de privacidade e confiabilidade das informações',
  italiano:   'Informazione riservata e Privacy',
  deutsch:    'Kraftstoffbetrieb besitzen Privacy statement'
};

// Google Maps embed for contact page (from original head_common.php)
var CONTACT_MAP_SRC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2905.957675037961!2d-65.3053496!3d-43.25230885!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xbe0144b62fdd475d%3A0x7db7e56184e5cdee!2sItalia+20%2C+trelew!5e0!3m2!1ses-419!2s!4v1390065690941';

// ── State ──────────────────────────────────────────────────────────────────
var appData    = null;   // content.json
var inicioData = null;   // inicio.json
var hotelesData = null;  // hoteles.json (lazy)
var slidesInitialized = false;
var sidebarInterval = null;

// ── Init ───────────────────────────────────────────────────────────────────
$(document).ready(function () {
  // Normalize URL: if no params, set defaults
  if (!window.location.search) {
    history.replaceState({}, '', '?lang=' + DEFAULT_LANG + '&data=' + DEFAULT_DATA);
  }

  // Load content + inicio in parallel, then render
  Promise.all([
    fetch('data/content.json').then(function (r) { return r.json(); }),
    fetch('data/inicio.json').then(function (r) { return r.json(); })
  ]).then(function (results) {
    appData    = results[0];
    inicioData = results[1];
    render();
  }).catch(function (err) {
    document.getElementById('main-content').innerHTML =
      '<p style="color:red;">Error loading site data. Make sure to open via a local server (not file://).</p>';
    console.error(err);
  });

  // Language selector
  $('#lang-select').on('change', function () {
    var params = getParams();
    navigate($(this).val(), params.data, params.paq, params.ciudad);
  });

  // Browser back/forward
  window.addEventListener('popstate', render);
});

// ── URL helpers ────────────────────────────────────────────────────────────
function getParams() {
  var p = new URLSearchParams(window.location.search);
  return {
    lang:   p.get('lang')   || DEFAULT_LANG,
    data:   p.get('data')   || DEFAULT_DATA,
    paq:    p.get('paq')    || null,
    ciudad: p.get('ciudad') || null,
    shop:   p.get('shop')   || null
  };
}

function navigate(lang, data, paq, ciudad) {
  var url = '?lang=' + lang + '&data=' + data;
  if (paq)    url += '&paq=' + encodeURIComponent(paq);
  if (ciudad) url += '&ciudad=' + encodeURIComponent(ciudad);
  history.pushState({}, '', url);
  render();
}

// ── Main render ────────────────────────────────────────────────────────────
function render() {
  if (!appData || !inicioData) return;

  var params = getParams();
  var lang = LANGS.indexOf(params.lang) !== -1 ? params.lang : DEFAULT_LANG;
  var data = params.data || DEFAULT_DATA;

  // Update lang select
  $('#lang-select').val(lang);

  // Logo link
  $('#logo-link').attr('href', '?lang=' + lang + '&data=idx');

  // Header band CSS class: first 3 chars of data + "bg"
  var sectionPrefix = data.substring(0, 3);
  $('#menuque-band').attr('class', 'menuque ' + sectionPrefix + 'bg');

  updateNav(lang, data);
  updateHeaderBand(data);
  updateSidebar(lang);
  updateFooter(lang, data);
  renderContent(lang, data, params);
}

// ── Navigation ─────────────────────────────────────────────────────────────
function updateNav(lang, data) {
  var nav = inicioData[lang] ? inicioData[lang].nav : {};
  var sectionPrefix = data.substring(0, 3);

  var items = [
    { label: decodeURIComponent(nav.home      || 'Inicio'),   key: 'idx' },
    { label: decodeURIComponent(nav.nosotros  || 'Nosotros'), key: 'nos' },
    { label: decodeURIComponent(nav.servicios || 'Servicios'),key: 'srv' },
    { label: decodeURIComponent(nav.contacto  || 'Contacto'), key: 'cnt' }
  ];

  var html = '';
  items.forEach(function (item) {
    var bold = sectionPrefix === item.key ? ' style="font-weight:bolder;"' : '';
    html += '<li class="' + item.key + 'bg">' +
              '<a href="?lang=' + lang + '&data=' + item.key + '"' + bold + '>' +
                item.label +
              '</a>' +
            '</li>';
  });
  $('#nav-list').html(html);
}

// ── Header band: slider vs. Google Maps ───────────────────────────────────
function updateHeaderBand(data) {
  if (data === 'cnt') {
    // Show Google Maps, reset slider state
    $('#header-media').html(
      '<iframe style="width:100%;position:relative;margin:0;" src="' + CONTACT_MAP_SRC + '" ' +
        'width="800" height="320" frameborder="0" style="border:0"></iframe>'
    );
    slidesInitialized = false;
  } else {
    if (!slidesInitialized) {
      $('#header-media').html(
        '<div id="slides">' +
          '<img src="imagenes/sli_1.jpg"/>' +
          '<img src="imagenes/sli_2.jpg"/>' +
          '<img src="imagenes/sli_3.jpg"/>' +
          '<img src="imagenes/sli_4.jpg"/>' +
          '<img src="imagenes/sli_5.jpg"/>' +
          '<img src="imagenes/sli_6.jpg"/>' +
        '</div>'
      );
      setTimeout(function () {
        $('#slides').slidesjs({
          width: 920,
          height: 363,
          play: {
            active: true,
            auto: true,
            interval: 3200,
            swap: true,
            pauseOnHover: true,
            restartDelay: 2500
          },
          pagination: { active: false, effect: 'fade' }
        });
        slidesInitialized = true;
      }, 50);
    }
  }
}

// ── Right sidebar ──────────────────────────────────────────────────────────
function updateSidebar(lang) {
  if (sidebarInterval) {
    clearInterval(sidebarInterval);
    sidebarInterval = null;
  }

  var cuadroder = inicioData[lang] ? inicioData[lang].cuadroder : '';
  $('#sidebar-right').html(cuadroder);

  // Fade-cycle the cuadroder divs (mirrors header.php #slider logic)
  $('#sidebar-right div:gt(0)').hide();
  sidebarInterval = setInterval(function () {
    $('#sidebar-right div:first-child')
      .fadeOut(0)
      .next('div').fadeIn(1000)
      .end().appendTo('#sidebar-right');
  }, 4000);
}

// ── Footer ─────────────────────────────────────────────────────────────────
function updateFooter(lang, data) {
  var label = PRIVACY_LABELS[lang] || PRIVACY_LABELS.espanol;
  $('#footer-privacy-link')
    .attr('href', '?lang=' + lang + '&data=idx_terminos')
    .text(label);
}

// ── Content rendering ──────────────────────────────────────────────────────
function renderContent(lang, data, params) {
  var langData = appData[lang];
  if (!langData) {
    $('#main-content').html('<p>Language not found.</p>');
    return;
  }
  var sections = langData.sections;

  // Special: privacy terms from inicio.json
  if (data === 'idx_terminos') {
    var terminos = inicioData[lang] ? inicioData[lang].terminos : '';
    $('#main-content').html('<div class="tabloque main">' + terminos + '</div>');
    return;
  }

  var sectionData = sections[data];
  if (!sectionData) {
    $('#main-content').html('<p>Section not found.</p>');
    return;
  }

  var html = '';

  // Sub-nav titulares
  if (sectionData.titulares) {
    html += renderTitulares(sectionData.titulares, lang, data);
  }

  html += '<div class="tabloque main">';

  switch (data) {
    case 'srv':
      html += renderPackages(lang, sectionData, params, sections);
      break;
    case 'srv_hoteles':
      html += sectionData.html || '';
      html += '<div id="hoteles-container"><p>Cargando hoteles...</p></div>';
      break;
    case 'cnt':
      html += sectionData.html || '';
      html += renderContactForm(lang, params.shop);
      break;
    default:
      html += sectionData.html || '';
      break;
  }

  html += '</div>';
  $('#main-content').html(html);

  // Post-render hooks
  if (data === 'srv_hoteles') {
    loadHoteles(lang, params.ciudad);
  }
  if (data === 'srv_excursiones') {
    initShowhide();
  }
  // Scroll to package block if paq selected
  if (data === 'srv' && params.paq && document.getElementById('paquebloque')) {
    setTimeout(function () {
      document.getElementById('paquebloque').scrollIntoView({ behavior: 'smooth' });
    }, 80);
  }
}

// ── Sub-nav (titulares) ────────────────────────────────────────────────────
function renderTitulares(titulares, lang, currentData) {
  var sectionPrefix = currentData.substring(0, 3);
  var html = '<div class="menu-especial"><ul>';
  titulares.forEach(function (t) {
    var selected = t.data === currentData ? ' selected' : '';
    html += '<li class="' + sectionPrefix + 'bg' + selected + '">' +
              '<a href="?lang=' + lang + '&data=' + t.data + '">' +
                '<i class="' + t.icon + '"></i> ' + t.label +
              '</a>' +
            '</li>';
  });
  html += '</ul></div>';
  return html;
}

// ── Package grid + detail ──────────────────────────────────────────────────
function renderPackages(lang, srvSection, params, sections) {
  var html = srvSection.intro || '';

  // Grid of tiles
  html += '<div class="tabla" id="tabla">';
  (srvSection.paquetes || []).forEach(function (paq) {
    var especial = parseInt(paq.id) >= 100 ? ' especial' : '';
    html += '<a href="?data=srv&lang=' + lang + '&paq=' + encodeURIComponent(paq.id) + '#paquebloque">' +
              '<div class="item' + especial + '">' +
                '<span>' + paq.titulo + '</span>' +
              '</div>' +
            '</a>';
  });
  html += '</div>';

  // Detail block for selected package
  if (params.paq !== null) {
    var matching = (srvSection.paquetes || []).filter(function (p) {
      return p.id === params.paq;
    });
    if (matching.length > 0) {
      html += '<div id="paquebloque">';
      matching.forEach(function (paq) {
        var interesaLabel = inicioData && inicioData[lang] ? inicioData[lang].compra : 'Me interesa';
        var shopParam = encodeURIComponent('Paquete ' + paq.id + ': ' + paq.titulo);
        html += '<h3>' + paq.titulo + '</h3>' +
                '<div class="func">' +
                  '<img src="imagenes/paq/' + paq.id + '.jpg" onerror="this.style.display=\'none\'" />' +
                  '<div class="interesa">' +
                    '<a href="?data=cnt&lang=' + lang + '&shop=' + shopParam + '">' +
                      interesaLabel +
                    '</a>' +
                  '</div>' +
                '</div>' +
                '<p>' + paq.html + '</p>';
      });
      html += '</div>';
    }
  }

  return html;
}

// ── Hotels section ─────────────────────────────────────────────────────────
function loadHoteles(lang, selectedCiudad) {
  if (hotelesData) {
    doRenderHoteles(lang, selectedCiudad);
    return;
  }
  fetch('data/hoteles.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      hotelesData = data;
      doRenderHoteles(lang, selectedCiudad);
    });
}

function doRenderHoteles(lang, selectedCiudad) {
  var html = '<div class="menu-under" id="menu-under"><ul style="width:100%;">';
  hotelesData.ciudades.forEach(function (ciudad) {
    var sel = ciudad.name === selectedCiudad ? ' selected' : '';
    html += '<li><a href="?lang=' + lang + '&data=srv_hoteles&ciudad=' +
              encodeURIComponent(ciudad.name) + '#menu-under" class="' + sel + '">' +
              ciudad.name +
            '</a></li>';
  });
  html += '</ul></div>';

  if (selectedCiudad) {
    var cityData = null;
    hotelesData.ciudades.forEach(function (c) {
      if (c.name === selectedCiudad) cityData = c;
    });
    if (cityData) {
      if (cityData.mapa) {
        html += '<div class="hoteles">' +
                  '<iframe src="' + cityData.mapa + '" width="575" height="250" frameborder="0"></iframe>' +
                '</div>';
      }
      cityData.hoteles.forEach(function (hotel) {
        var stars = '';
        if (hotel.estrellas > 0) {
          for (var i = 0; i < hotel.estrellas; i++) {
            stars += '<i class="fa fa-star"></i>';
          }
        } else {
          stars = '<br>';
        }
        var webLink = hotel.web
          ? '<div class="web"><a href="' + hotel.web + '" target="_blank"><i class="fa fa-external-link"></i></a></div>'
          : '';
        html += '<div class="hoteles">' +
                  '<img src="' + hotel.imagen + '"/>' +
                  '<div class="info">' + hotel.nombre + '<br>' + stars + '</div>' +
                  webLink +
                '</div>';
      });
    }
  }

  $('#hoteles-container').html(html);

  if (selectedCiudad) {
    setTimeout(function () {
      var el = document.getElementById('menu-under');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  }
}

// ── Contact form ───────────────────────────────────────────────────────────
function renderContactForm(lang, shop) {
  var formLabels = inicioData && inicioData[lang] ? inicioData[lang].form : {};
  var nombreLabel  = formLabels.nombre  || 'Nombre';
  var emailLabel   = formLabels.email   || 'Email';
  var mensajeLabel = formLabels.mensaje || 'Mensaje';
  var compraLabel  = inicioData && inicioData[lang] ? inicioData[lang].compra : 'Me interesa';

  var shopField = '';
  if (shop) {
    var decodedShop = decodeURIComponent(shop);
    shopField = '<label for="shop"><h4>' + compraLabel + ':</h4></label>' +
                '<input type="text" name="shop" id="shop" readonly value="' + decodedShop + '" />';
  }

  // Form action is a placeholder — wire in a real endpoint (e.g. Formspree) to enable submissions
  return '<form action="#" method="post" id="contact-form">' +
    '<label for="nombre"><h4>' + nombreLabel + ':</h4></label>' +
    '<input id="nombre" type="text" name="nombre" placeholder="Nombre y Apellido" required />' +
    '<label for="email"><h4>' + emailLabel + ':</h4></label>' +
    '<input type="email" name="email" id="email" placeholder="Email" required />' +
    shopField +
    '<label for="mensaje"><h4>' + mensajeLabel + ':</h4></label>' +
    '<textarea id="mensaje" name="mensaje" placeholder="Mensaje" required></textarea>' +
    '<input id="submit" class="cntbg" type="submit" name="submit" value="Enviar" />' +
    '</form>';
}

// ── Excursiones accordion ──────────────────────────────────────────────────
function initShowhide() {
  $('#showhide h1').off('click').on('click', function () {
    $(this).next('div').slideToggle();
  });
}
