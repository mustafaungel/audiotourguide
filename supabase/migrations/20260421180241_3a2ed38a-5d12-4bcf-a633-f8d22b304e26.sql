-- Remove French duplicate section that has English title (kept incorrectly during translation)
DELETE FROM public.guide_sections 
WHERE id = 'dde94a71-5304-4ae3-9f00-a39f85e192b4';