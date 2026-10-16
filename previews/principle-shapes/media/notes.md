# Principles section: live reference (www.jtcreative.design, pulled 2026-10-16)

## Structure
section.section_principles.page-padding > .container.principles_container
- .principles_sticky-video holds 4 stacked .principle_video_wrap layers:
  1. .principles_video.is-intro: lead H2 "Great work is more than how it looks. It's how it thinks, works and evolves."
  2-4. .principles_video > .principle-img.is-vid.w-background-video (autoplay, loop, muted, playsinline, data-object-fit="cover")
- .principles_video-scale_trigger
- .principles_content: 3 x .principles_item_wrap (eyebrow number, h2.principles-sub-text, .principles_item-visual, p.principles_item_description)
- .principles_item-visual is EMPTY in all 3 items (item 1 has an empty .principles_item_video, display:none). No Bunny URLs in this section.

## Copy and videos (in order)
1. Start with purpose.
   Before deciding what something should look like, understand what it needs to do, who it's for and why it matters.
   mp4  https://cdn.prod.website-files.com/6ac66533162bac8c8f01fb1b/6ac66533162bac8c8f01fb74_purpose-vid-v2_mp4.mp4  (780x720, 5.0s)
   webm https://cdn.prod.website-files.com/6ac66533162bac8c8f01fb1b/6ac66533162bac8c8f01fb74_purpose-vid-v2_webm.webm
   poster https://cdn.prod.website-files.com/69aece3fa67f749435e5f196%2F6aa81a24ce6041a724ebf9ab_purpose-vid-v2_poster.0000000.jpg
2. Push the idea.
   Good ideas deserve to be explored. Refine, challenge and evolve the concept until it holds up.
   mp4  https://cdn.prod.website-files.com/6ac66533162bac8c8f01fb1b/6ac66533162bac8c8f01fb8c_Scene-4%20(2)_mp4.mp4  (780x720, 5.0s)
   webm https://cdn.prod.website-files.com/6ac66533162bac8c8f01fb1b/6ac66533162bac8c8f01fb8c_Scene-4%20(2)_webm.webm
   poster https://cdn.prod.website-files.com/69aece3fa67f749435e5f196%2F6aaa822286ab1aa11a5b74ac_Scene-4%20%282%29_poster.0000000.jpg
3. Design through the build.
   I keep designing while I build, so the details make it to launch. Every interaction, transition and detail should have a reason for being there.
   mp4  https://cdn.prod.website-files.com/6ac66533162bac8c8f01fb1b/6ac66533162bac8c8f01fb88_hive-mobile_mp4.mp4  (852x720, 3.87s)
   webm https://cdn.prod.website-files.com/6ac66533162bac8c8f01fb1b/6ac66533162bac8c8f01fb88_hive-mobile_webm.webm
   poster https://cdn.prod.website-files.com/69aece3fa67f749435e5f196%2F6aa86aefd32f90a94055ed4c_hive-mobile_poster.0000000.jpg
(Poster URLs point at the old site id's CDN path, but they are what the live page uses.)

## Local files
1-purpose.mp4 (720x664), 2-push.mp4 (720x664), 3-build.mp4 (720x608): full clip (sources are under 6s), H.264, no audio, crf 30, 84-144 KB.
*-poster.jpg: frame at 1s.

## CSS (shared css: jt-creative-staging.webflow.shared.36ecc7aed.css; no principle rules inside media queries)
.container.principles_container { width: min(92vw, 1600px) }
.section_principles { position: relative } .section_principles.page-padding { justify-content:center; align-items:center }
.principles_sticky-video { height:100vh; position:sticky; top:0 }
.principle_video_wrap { position:absolute; inset:0; width:100%; height:100vh; display:flex; flex-flow:row; justify-content:center; align-items:center }
.principle_video_wrap.is-first { height:0 }
.principles_video { box-sizing:border-box; aspect-ratio:1; border-radius:var(--spacing--radius-sm); width:clamp(24rem, 38vw, 42rem); max-width:70vw; max-height:70vh; overflow:hidden }
  --spacing--radius-sm: clamp(6px, .6vw, 10px)
.principles_video.is-intro { width:100%; height:100vh; display:flex; justify-content:center; align-items:center }
.principle-img { width:100%; height:100% }   video: data-object-fit="cover" (Webflow bg video = object-fit cover)
.principle-vid { aspect-ratio:1; width:100%; height:100% }
.principles_video-scale_trigger { z-index:99; height:40vh; margin-top:-20vh; position:relative }
.principles_content { mix-blend-mode:exclusion; margin-bottom:10vh }
.principles_item-visual { height:50vh }   .principles_item_video { display:none }
.principles_item_layout { display:block } (grid props set but unused)
.principles-sub-text { max-width:10ch; font-family:var(--typography--font-display); font-size:var(--typography--type-h2-sm); text-transform:uppercase; text-wrap:balance; line-height:1.2 }
.principles_item_description { max-width:22rem; width:clamp(14rem,18vw,20rem); margin-left:auto; text-align:right; text-indent:10ch; text-wrap:balance; mix-blend-mode:difference; font-size:clamp(.9rem,1.1vw,1.125rem); color:var(--color--text-primary) }
