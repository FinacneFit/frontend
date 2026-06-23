<script setup>
import profileImg from '@/assets/profile.svg'

defineProps({
  nickname: { type: String, default: '' },
  size: { type: String, default: 'md' }, // xs | sm | md | lg | xl
})
</script>

<template>
  <img
    :src="profileImg"
    class="avatar"
    :class="`size-${size}`"
    alt="profile"
    draggable="false"
  />
</template>

<style scoped>
.avatar {
  border-radius: 50%;
  display: block;
  flex-shrink: 0;
  object-fit: cover;
  user-select: none;
}
.size-xs  { width: 20px;  height: 20px;  }
.size-sm  { width: 28px;  height: 28px;  }
.size-md  { width: 40px;  height: 40px;  }
.size-lg  { width: 56px;  height: 56px;  }
.size-xl  { width: 80px;  height: 80px;  }
</style>
