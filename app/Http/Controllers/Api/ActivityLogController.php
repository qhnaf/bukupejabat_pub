<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user');

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereDate('created_at', '>=', $request->start_date)
                  ->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'action' => 'required|string',
            'description' => 'required|string',
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(), // AMAN: Mengambil langsung dari token server
            'action' => $request->action,
            'description' => $request->description,
        ]);

        return response()->json(['success' => true]);
    }

    public function export(Request $request)
    {
        $query = ActivityLog::with('user');

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereDate('created_at', '>=', $request->start_date)
                  ->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->latest()->get();

        $fileName = 'log_aktivitas_' . date('Ymd_His') . '.csv';

        $headers = array(
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        );

        $columns = ['Date', 'Time', 'User', 'Action', 'Details'];

        $callback = function() use($logs, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($logs as $log) {
                $row['Date']    = $log->created_at->format('Y-m-d');
                $row['Time']    = $log->created_at->format('H:i:s');
                $row['User']    = $log->user ? $log->user->username : 'User Terhapus';
                $row['Action']  = $log->action;
                $row['Details'] = $log->description;

                fputcsv($file, array($row['Date'], $row['Time'], $row['User'], $row['Action'], $row['Details']));
            }

            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }
}