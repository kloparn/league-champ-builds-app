<script lang="ts">
  const year = new Date().getFullYear();
</script>

<footer class="mt-16 border-t border-hex-border bg-hex-deep">
  <div class="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center md:px-8">
    <p class="font-display text-sm uppercase tracking-widest text-hex-gold">
      League Champ Builds
    </p>
    <p class="text-xs text-hex-mist">
      Created by Adam Håkansson. © {year}
    </p>
    <p class="max-w-2xl text-[11px] leading-relaxed text-hex-mist/70">
      League Champ Builds isn't endorsed by Riot Games and doesn't reflect the views or opinions
      of Riot Games or anyone officially involved in producing or managing Riot Games properties.
      Riot Games, and all associated properties are trademarks or registered trademarks of Riot
      Games, Inc. Champion data via
      <a
        href="https://developer.riotgames.com/docs/lol#data-dragon"
        rel="noreferrer noopener"
        target="_blank"
        class="text-hex-gold hover:text-hex-goldHi underline-offset-2 hover:underline"
      >
        Data Dragon
      </a>.
    </p>
  </div>
</footer>
