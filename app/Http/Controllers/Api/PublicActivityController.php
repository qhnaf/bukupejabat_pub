<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicActivityCount;
use Illuminate\Http\Request;

class PublicActivityController extends Controller
{
    public function hit(Request $request)
    {
        $request->validate([
            'type' => 'required|in:preview,download'
        ]);

        $date = now()->toDateString();
        
        $activity = PublicActivityCount::firstOrCreate(
            ['date' => $date, 'type' => $request->type]
        );
        
        $activity->increment('count');

        return response()->json(['success' => true]);
    }

    public function stats(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = PublicActivityCount::query();

        if ($startDate && $endDate) {
            $query->whereBetween('date', [$startDate, $endDate]);
        } else {
            // Default: last 7 days
            $query->where('date', '>=', now()->subDays(7)->toDateString());
        }

        $stats = $query->orderBy('date', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
