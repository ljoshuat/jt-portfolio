/* =========================
   WEBFLOW RESET
========================= */

function resetWebflow(data) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(data.next.html, "text/html");
  const webflowPageId = dom.querySelector("html")?.getAttribute("data-wf-page");

  if (webflowPageId) {
    document.documentElement.setAttribute("data-wf-page", webflowPageId);
  }

  if (window.Webflow) {
    const ix2 = window.Webflow.require("ix2");

    window.Webflow.destroy();
    ix2.destroy();
    window.Webflow.ready();
    ix2.init();
  }
}

function makeItemActive() {
  let cmsPageName = $(".cms-page").find(".item-name").text();
  $(".w-dyn-item").each(function (index) {
    if ($(this).find(".item-name").text() === cmsPageName) {
      $(this).addClass("active-flip-item");
    }
  });
}

function flip(outgoing, incoming) {
  let state = Flip.getState(outgoing.find(".visual"));
  incoming.find(".visual").remove();
  outgoing.find(".visual").appendTo(incoming);
  Flip.from(state, { duration: 0.5, ease: "power1.inOut" });
}

barba.hooks.after((data) => {
  $(data.next.container).removeClass("fixed");
  $(".active-flip-item").removeClass("active-flip-item");
  $(window).scrollTop(0);
  resetWebflow(data);
});

barba.init({
  preventRunning: true,
  transitions: [
    {
      sync: true,
      from: { namespace: ["grid-page"] },
      to: { namespace: ["cms-page"] },
      enter(data) {
        makeItemActive();
        $(data.next.container).addClass("fixed");
        flip($(".active-flip-item"), $(".cms-page_img-wrap"));
        return gsap.to(data.current.container, { opacity: 0, duration: 0.5 });
      },
    },
    {
      sync: true,
      from: { namespace: ["cms-page"] },
      to: { namespace: ["grid-page"] },
      enter(data) {
        makeItemActive();
        createSwiper();
        mySlider.slideTo($(".active-flip-item").index(), 0);
        $(data.next.container).addClass("fixed");
        flip($(".cms-page_img-wrap"), $(".active-flip-item .visual_wrap"));
        return gsap.to(data.current.container, { opacity: 0, duration: 0.5 });
      },
    },
  ],
});
