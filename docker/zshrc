

export LESSCHARSET="utf-8"
export TOP=~
export PAGER=less # make man use "less", not "more"!
export EDITOR="emacs -nw"
export VISUAL="emacs -nw"
export SHELL=/bin/zsh   # espcially for screen

export LANG=en_US.UTF-8 # make it so "ls" of filenames w/ UTF-8 chars work

# eg: "xenial" or "alpine"
export UNAME=$((fgrep CODENAME /etc/lsb-release 2>/dev/null  ||  cat /etc/issue|cut -f3 -d' '|head -1|tr A-Z a-z) |cut -f2 -d=)




  # make less more friendly for non-text input files, see lesspipe(1)
  [ -x /usr/bin/lesspipe ] && eval "$(lesspipe)"


  if [ "$HOME" = "/root" ]; then
    export PETABOX_HOME=/petabox
  else
    export PETABOX_HOME=$HOME/petabox
  fi

  export MANPATH=/usr/man:/usr/local/man:/usr/share/man
  export PATH=/bin:/usr/bin:/usr/local/bin:/sbin:/usr/local/sbin:/etc:/usr/sbin:$PETABOX_HOME/sw/bin:$PETABOX_HOME/bin:$PETABOX_HOME/tv/bin:$PETABOX_HOME/deriver:/usr/lib/postgresql/9.5/bin;

  # UNIX color listing
  eval "$(dircolors -b)"



if [ "$SCREENNUM" != "" ]; then
  SCREENNUM="[SCREEN #$SCREENNUM]";
else
  SCREENNUM=;
fi




if [ ! $?USER ]; then    USER=`whoami`; export USER;  fi



# Set up the prompt

autoload -Uz promptinit
promptinit

autoload -U select-word-style
select-word-style bash


setopt histignorealldups
#setopt sharehistory


# Keep 10000 lines of history within the shell and save it to ~/.history:
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.history

# Use modern completion system
autoload -Uz compinit
compinit -d ~/.completions
rm -f $HOME/.zcompdump;

zstyle ':completion:*' auto-description 'specify: %d'
zstyle ':completion:*' completer _expand _complete _correct _approximate
zstyle ':completion:*' format 'Completing %d'
zstyle ':completion:*' group-name ''
zstyle ':completion:*' menu select=2


zstyle ':completion:*:default' list-colors ${(s.:.)LS_COLORS}
zstyle ':completion:*' list-colors ''
zstyle ':completion:*' list-prompt %SAt %p: Hit TAB for more, or the character to insert%s
zstyle ':completion:*' matcher-list '' 'm:{a-z}={A-Z}' 'm:{a-zA-Z}={A-Za-z}' 'r:|[._-]=* r:|=* l:|=*'
zstyle ':completion:*' menu select=long
zstyle ':completion:*' select-prompt %SScrolling active: current selection at %p%s
zstyle ':completion:*' use-compctl false
zstyle ':completion:*' verbose true

zstyle ':completion:*:*:kill:*:processes' list-colors '=(#b) #([0-9]#)*=0=01;31'
zstyle ':completion:*:kill:*' command 'ps -u $USER -o pid,%cpu,tty,cputime,cmd'







# Use emacs keybindings even if our EDITOR is set to vi
bindkey -e
# tracey cmd-line key remaps.  schwing
bindkey '^B' backward-word
bindkey '^F' forward-word
bindkey '^D' kill-word
bindkey '^V' up-case-word
bindkey '^W' kill-region
bindkey '^G' accept-and-hold
# tracey cmd-line key remaps.  schwing

setopt noclobber        # dont overwrite existing files by default
setopt nonomatch        # stfu when no ls matches
setopt chase_links      # move to actual locations for symlinks
setopt ignoreeof        # dont have CTL-D on empty line log us out!
ulimit -n 1024




source $HOME/.aliases
ttlhost




# [derived and altered from "adam1" prompt]
#
# Usage: prompt_tracey [<color1> [<color2>]]
# where the colors are for the user@host background and current working
# directory respectively.  The default colors are blue and magenta.
# This theme works best with a dark background.
function prompt_tracey () {
  prompt_tracey_color1=${1:-'blue'}
  prompt_tracey_color2=${2:-'magenta'}

  base_prompt="%K{$prompt_tracey_color1}%n@%m%k $UNAME"
  post_prompt="%b%f%k"

  base_prompt_no_color=$(echo "$base_prompt" |perl -pe 's/%(K\{.*?\}|k)//g')
  post_prompt_no_color=$(echo "$post_prompt" |perl -pe 's/%(K\{.*?\}|k)//g')

  add-zsh-hook precmd prompt_tracey_precmd
}

function prompt_tracey_precmd () {
  setopt noxtrace localoptions
  local base_prompt_expanded_no_color

  base_prompt_expanded_no_color=$(print -P "$base_prompt_no_color")
  # allow, um, up to 98 subdirs in prompt -- and THEN prefix w/ "..." if >= 99 8-)
  path_prompt="%t %B%F{$prompt_tracey_color2}%(99~|...|)%98~$prompt_newline%F{white}"
  PS1="$base_prompt$SCREENNUM$path_prompt > $post_prompt"
  PS2="$base_prompt$SCREENNUM$path_prompt %_> $post_prompt"
  PS3="$base_prompt$SCREENNUM$path_prompt ?# $post_prompt"
}

prompt_tracey
