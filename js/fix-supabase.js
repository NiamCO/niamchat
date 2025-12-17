// fix-supabase.js - Fix Supabase loading issues
document.addEventListener('DOMContentLoaded', function() {
    console.log('Running Supabase fix...');
    
    // Wait a bit for Supabase to load
    setTimeout(function() {
        if (!window.supabase || !window.supabaseClient) {
            console.error('Supabase not loaded, creating fallback...');
            
            // Create a dummy supabase client to prevent errors
            window.supabaseClient = {
                from: () => ({
                    select: () => ({ 
                        eq: () => ({ 
                            single: () => Promise.resolve({ data: null, error: null }),
                            order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) })
                        }),
                        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
                        update: () => ({ eq: () => Promise.resolve({ error: null }) })
                    })
                }),
                channel: () => ({ on: () => ({ subscribe: () => {} }) }),
                removeChannel: () => {}
            };
            
            // Also set currentUser to prevent other errors
            if (!window.currentUser) {
                window.currentUser = {
                    id: 'temp-' + Date.now(),
                    username: localStorage.getItem('niamchat_username') || 'Guest',
                    displayName: localStorage.getItem('niamchat_username') || 'Guest',
                    role: 'user',
                    online: true
                };
            }
            
            console.log('Fallback Supabase client created');
        } else {
            console.log('Supabase is loaded properly');
        }
    }, 2000); // Wait 2 seconds
});
